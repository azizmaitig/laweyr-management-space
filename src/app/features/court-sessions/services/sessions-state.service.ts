import { Injectable, inject, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, catchError, interval, map, of, tap } from 'rxjs';
import type { CourtSessionEventPayload, Session } from '../../../core/models';
import { AppEventType } from '../../../core/models/events.model';
import { EventService } from '../../../core/services/event.service';
import { newClientRequestId } from '../court-sessions-request.util';
import { reviveSession } from '../court-sessions-dates.util';
import { CreateSessionDto, SessionsApiService, UpdateSessionDto } from './sessions-api.service';

export type SessionWriteKind = 'create' | 'update';

export interface SessionsState {
  sessions: Session[];
  loading: boolean;
  error: string | null;
  /** Server id or optimistic temp id (negative) → in-flight write */
  sessionWritePending: Record<number, SessionWriteKind>;
}

const initialState: SessionsState = {
  sessions: [],
  loading: false,
  error: null,
  sessionWritePending: {},
};

const REMINDER_POLL_MS = 60 * 60 * 1000;

function cloneSession(s: Session): Session {
  return {
    ...s,
    date: new Date(s.date),
    nextSessionDate: s.nextSessionDate ? new Date(s.nextSessionDate) : undefined,
  };
}

function omitPendingKey(
  pending: Record<number, SessionWriteKind>,
  id: number
): Record<number, SessionWriteKind> {
  const { [id]: _, ...rest } = pending;
  return rest;
}

@Injectable({ providedIn: 'root' })
export class SessionsStateService implements OnDestroy {
  private api = inject(SessionsApiService);
  private events = inject(EventService);
  private state = new BehaviorSubject<SessionsState>(initialState);
  state$ = this.state.asObservable();

  private subscriptions = new Subscription();
  private reminderEmittedForSessionId = new Set<number>();
  private tempSessionCounter = 0;

  constructor() {
    this.setupEventListeners();
    this.subscriptions.add(interval(REMINDER_POLL_MS).subscribe(() => this.checkSessionReminders()));
  }

  private nextTempSessionId(): number {
    return --this.tempSessionCounter;
  }

  private setupEventListeners(): void {
    this.subscriptions.add(
      this.events.on<number>(AppEventType.CASE_SELECTED).subscribe(caseId => this.loadSessions(caseId))
    );
    this.subscriptions.add(
      this.events.on(AppEventType.CASE_DELETED).subscribe(() => {
        this.reminderEmittedForSessionId.clear();
        this.patchState({
          sessions: [],
          sessionWritePending: {},
        });
      })
    );
    this.subscriptions.add(
      this.events.on<CourtSessionEventPayload>(AppEventType.SESSION_OUTCOME_RECORDED).subscribe(p => {
        if (!p.caseId || !p.nextSessionDate || !p.sessionId) return;
        const dto: CreateSessionDto = {
          caseId: p.caseId,
          date: p.nextSessionDate,
          court: p.court ?? '',
          type: p.type,
          status: 'UPCOMING',
        };
        this.createSession(dto);
      })
    );
  }

  selectSessions(caseId: number): Observable<Session[]> {
    return this.state$.pipe(map(s => s.sessions.filter(x => x.caseId === caseId)));
  }

  selectSessionWritePending(): Observable<Record<number, SessionWriteKind>> {
    return this.state$.pipe(map(s => s.sessionWritePending));
  }

  selectLoading(): Observable<boolean> {
    return this.state$.pipe(map(s => s.loading));
  }

  selectError(): Observable<string | null> {
    return this.state$.pipe(map(s => s.error));
  }

  loadSessions(caseId: number): void {
    this.patchState({ loading: true, error: null });
    this.api
      .getByCase(caseId)
      .pipe(
        tap(raw => {
          const serverSessions = raw.map(reviveSession);
          const optimistic = this.state.value.sessions.filter(s => s.id < 0 && s.caseId === caseId);
          this.patchState({
            sessions: [...optimistic, ...serverSessions],
            loading: false,
          });
          this.events.emit(AppEventType.SESSIONS_LOADED, { caseId, count: serverSessions.length });
          this.checkSessionReminders();
        }),
        catchError((err: { message: string }) => {
          this.patchState({ loading: false, error: err.message });
          this.events.emit(AppEventType.SESSION_ERROR, err.message);
          return of([] as Session[]);
        })
      )
      .subscribe();
  }

  createSession(dto: CreateSessionDto): void {
    const tempId = this.nextTempSessionId();
    const idem = newClientRequestId();
    const optimistic = reviveSession({
      id: tempId,
      caseId: dto.caseId,
      date: dto.date,
      court: dto.court,
      type: dto.type,
      status: dto.status,
      nextSessionDate: dto.nextSessionDate,
    } as Session);
    const cur = this.state.value;
    this.patchState({
      error: null,
      sessions: [optimistic, ...cur.sessions],
      sessionWritePending: { ...cur.sessionWritePending, [tempId]: 'create' },
    });

    this.api
      .create(dto, { idempotencyKey: idem })
      .pipe(
        tap(raw => {
          const session = reviveSession(raw);
          const pending = omitPendingKey(this.state.value.sessionWritePending, tempId);
          this.patchState({
            sessions: this.state.value.sessions.map(s => (s.id === tempId ? session : s)),
            sessionWritePending: pending,
          });
          this.events.emit(AppEventType.SESSION_CREATED, this.toPayload(session));
          this.checkSessionReminders();
        }),
        catchError((err: { message: string }) => {
          const pending = omitPendingKey(this.state.value.sessionWritePending, tempId);
          this.patchState({
            sessions: this.state.value.sessions.filter(s => s.id !== tempId),
            sessionWritePending: pending,
            error: err.message,
          });
          this.events.emit(AppEventType.SESSION_ERROR, err.message);
          return of(null);
        })
      )
      .subscribe();
  }

  updateSession(id: number, dto: UpdateSessionDto): void {
    if (id < 0) {
      const cur = this.state.value;
      const prev = cur.sessions.find(s => s.id === id);
      if (!prev) return;
      const merged = reviveSession({ ...prev, ...dto, id } as Session);
      this.patchState({
        sessions: cur.sessions.map(s => (s.id === id ? merged : s)),
      });
      return;
    }

    const cur = this.state.value;
    const prev = cur.sessions.find(s => s.id === id);
    if (!prev) return;
    const snapshot = cloneSession(prev);
    const optimistic = reviveSession({ ...snapshot, ...dto, id } as Session);
    const idem = newClientRequestId();

    this.patchState({
      error: null,
      sessions: cur.sessions.map(s => (s.id === id ? optimistic : s)),
      sessionWritePending: { ...cur.sessionWritePending, [id]: 'update' },
    });

    this.api
      .update(id, dto, { idempotencyKey: idem })
      .pipe(
        tap(raw => {
          const updated = reviveSession(raw);
          const pending = omitPendingKey(this.state.value.sessionWritePending, id);
          this.patchState({
            sessions: this.state.value.sessions.map(s => (s.id === id ? updated : s)),
            sessionWritePending: pending,
          });
          if (updated.status === 'COMPLETED') {
            this.events.emit(AppEventType.SESSION_COMPLETED, this.toPayload(updated));
          } else {
            this.events.emit(AppEventType.SESSION_UPDATED, this.toPayload(updated));
          }
          this.checkSessionReminders();
        }),
        catchError((err: { message: string }) => {
          const pending = omitPendingKey(this.state.value.sessionWritePending, id);
          const reverted = reviveSession({ ...snapshot, id } as Session);
          this.patchState({
            sessions: this.state.value.sessions.map(s => (s.id === id ? reverted : s)),
            sessionWritePending: pending,
            error: err.message,
          });
          this.events.emit(AppEventType.SESSION_ERROR, err.message);
          return of(null);
        })
      )
      .subscribe();
  }

  deleteSession(id: number): void {
    if (id < 0) {
      const pending = omitPendingKey(this.state.value.sessionWritePending, id);
      this.patchState({
        sessions: this.state.value.sessions.filter(s => s.id !== id),
        sessionWritePending: pending,
      });
      return;
    }

    const removed = this.state.value.sessions.find(s => s.id === id);
    this.patchState({ error: null });
    this.api
      .delete(id)
      .pipe(
        tap(() => {
          const current = this.state.value;
          this.reminderEmittedForSessionId.delete(id);
          this.patchState({ sessions: current.sessions.filter(s => s.id !== id) });
          this.events.emit(AppEventType.SESSION_DELETED, {
            caseId: removed?.caseId ?? 0,
            sessionId: id,
            date: removed?.date,
          } satisfies CourtSessionEventPayload);
        }),
        catchError((err: { message: string }) => {
          this.patchState({ error: err.message });
          this.events.emit(AppEventType.SESSION_ERROR, err.message);
          return of(null);
        })
      )
      .subscribe();
  }

  private checkSessionReminders(): void {
    const now = Date.now();
    const sessions = this.state.value.sessions;
    for (const s of sessions) {
      if (s.id < 0 || s.status !== 'UPCOMING') continue;
      const sessionTime = new Date(s.date).getTime();
      if (Number.isNaN(sessionTime)) continue;
      const msUntil = sessionTime - now;
      const hoursUntil = msUntil / (60 * 60 * 1000);
      if (hoursUntil > 0 && hoursUntil <= 48 && !this.reminderEmittedForSessionId.has(s.id)) {
        this.reminderEmittedForSessionId.add(s.id);
        this.events.emit(AppEventType.SESSION_REMINDER, {
          caseId: s.caseId,
          sessionId: s.id,
          date: s.date,
        } satisfies CourtSessionEventPayload);
      }
      if (msUntil <= 0) {
        this.reminderEmittedForSessionId.delete(s.id);
      }
    }
  }

  private toPayload(session: Session): CourtSessionEventPayload {
    return {
      caseId: session.caseId,
      sessionId: session.id,
      date: session.date,
    };
  }

  private patchState(partial: Partial<SessionsState>): void {
    this.state.next({ ...this.state.value, ...partial });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
