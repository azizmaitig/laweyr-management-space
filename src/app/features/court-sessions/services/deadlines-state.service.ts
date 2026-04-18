import { Injectable, inject, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, catchError, map, of, tap, timer } from 'rxjs';
import type { CourtSessionEventPayload, Deadline } from '../../../core/models';
import { AppEventType } from '../../../core/models/events.model';
import { EventService } from '../../../core/services/event.service';
import { newClientRequestId } from '../court-sessions-request.util';
import { reviveDeadline } from '../court-sessions-dates.util';
import { CreateDeadlineDto, DeadlinesApiService, UpdateDeadlineDto } from './deadlines-api.service';

export type DeadlineWriteKind = 'create' | 'update';

export interface DeadlinesState {
  deadlines: Deadline[];
  loading: boolean;
  error: string | null;
  deadlineWritePending: Record<number, DeadlineWriteKind>;
}

const initialState: DeadlinesState = {
  deadlines: [],
  loading: false,
  error: null,
  deadlineWritePending: {},
};

const DEADLINE_POLL_MS = 24 * 60 * 60 * 1000;

type AlertWindow = '7d' | '3d' | '24h';

function cloneDeadline(d: Deadline): Deadline {
  return {
    ...d,
    dueDate: new Date(d.dueDate),
    notifiedLevels: [...d.notifiedLevels],
  };
}

function omitDeadlinePending(
  pending: Record<number, DeadlineWriteKind>,
  id: number
): Record<number, DeadlineWriteKind> {
  const { [id]: _, ...rest } = pending;
  return rest;
}

@Injectable({ providedIn: 'root' })
export class DeadlinesStateService implements OnDestroy {
  private api = inject(DeadlinesApiService);
  private events = inject(EventService);
  private state = new BehaviorSubject<DeadlinesState>(initialState);
  state$ = this.state.asObservable();

  private subscriptions = new Subscription();
  private alertDedup = new Set<string>();
  private tempDeadlineCounter = 0;
  private deadlineCaseId: number | null = null;

  constructor() {
    this.setupEventListeners();
    this.subscriptions.add(timer(0, DEADLINE_POLL_MS).subscribe(() => this.checkUpcomingDeadlines()));
  }

  private nextTempDeadlineId(): number {
    return --this.tempDeadlineCounter;
  }

  private setupEventListeners(): void {
    this.subscriptions.add(
      this.events.on<number>(AppEventType.CASE_SELECTED).subscribe(caseId => this.loadDeadlines(caseId))
    );
    this.subscriptions.add(
      this.events.on(AppEventType.CASE_DELETED).subscribe(() => {
        this.alertDedup.clear();
        this.deadlineCaseId = null;
        this.patchState({
          deadlines: [],
          deadlineWritePending: {},
        });
      })
    );
  }

  selectDeadlines(): Observable<Deadline[]> {
    return this.state$.pipe(map(s => s.deadlines));
  }

  selectDeadlineWritePending(): Observable<Record<number, DeadlineWriteKind>> {
    return this.state$.pipe(map(s => s.deadlineWritePending));
  }

  selectLoading(): Observable<boolean> {
    return this.state$.pipe(map(s => s.loading));
  }

  selectError(): Observable<string | null> {
    return this.state$.pipe(map(s => s.error));
  }

  loadDeadlines(caseId: number): void {
    if (this.deadlineCaseId !== caseId) {
      this.deadlineCaseId = caseId;
      this.alertDedup.clear();
      this.patchState({
        deadlines: [],
        deadlineWritePending: {},
        loading: true,
        error: null,
      });
    } else {
      this.patchState({ loading: true, error: null });
    }

    this.api
      .getByCase(caseId)
      .pipe(
        tap(raw => {
          const server = raw.map(reviveDeadline);
          const optimistic = this.state.value.deadlines.filter(d => d.id < 0 && d.caseId === caseId);
          this.alertDedup.clear();
          this.patchState({
            deadlines: [...optimistic, ...server],
            loading: false,
          });
          this.events.emit(AppEventType.DEADLINES_LOADED, { caseId, count: server.length });
          this.checkUpcomingDeadlines();
        }),
        catchError((err: { message: string }) => {
          this.patchState({ loading: false, error: err.message });
          this.events.emit(AppEventType.DEADLINE_ERROR, err.message);
          return of([] as Deadline[]);
        })
      )
      .subscribe();
  }

  addDeadline(dto: CreateDeadlineDto): void {
    const tempId = this.nextTempDeadlineId();
    const idem = newClientRequestId();
    const optimistic = reviveDeadline({
      id: tempId,
      ...dto,
      dueDate: dto.dueDate,
      notifiedLevels: [...dto.notifiedLevels],
    } as Deadline);

    const cur = this.state.value;
    this.patchState({
      error: null,
      deadlines: [optimistic, ...cur.deadlines],
      deadlineWritePending: { ...cur.deadlineWritePending, [tempId]: 'create' },
    });

    this.api
      .create(dto, { idempotencyKey: idem })
      .pipe(
        tap(raw => {
          const deadline = reviveDeadline(raw);
          this.patchState({
            deadlines: this.state.value.deadlines.map(d => (d.id === tempId ? deadline : d)),
            deadlineWritePending: omitDeadlinePending(this.state.value.deadlineWritePending, tempId),
          });
          this.events.emit(AppEventType.DEADLINE_CREATED, this.toPayload(deadline));
          this.checkUpcomingDeadlines();
        }),
        catchError((err: { message: string }) => {
          this.patchState({
            deadlines: this.state.value.deadlines.filter(d => d.id !== tempId),
            deadlineWritePending: omitDeadlinePending(this.state.value.deadlineWritePending, tempId),
            error: err.message,
          });
          this.events.emit(AppEventType.DEADLINE_ERROR, err.message);
          return of(null);
        })
      )
      .subscribe();
  }

  updateDeadline(id: number, dto: UpdateDeadlineDto): void {
    if (id < 0) {
      const cur = this.state.value;
      const prev = cur.deadlines.find(d => d.id === id);
      if (!prev) return;
      const merged = reviveDeadline({ ...prev, ...dto, id } as Deadline);
      this.patchState({
        deadlines: cur.deadlines.map(d => (d.id === id ? merged : d)),
      });
      return;
    }

    const cur = this.state.value;
    const prev = cur.deadlines.find(d => d.id === id);
    if (!prev) return;
    const snapshot = cloneDeadline(prev);
    const optimistic = reviveDeadline({ ...snapshot, ...dto, id } as Deadline);
    const idem = newClientRequestId();

    this.patchState({
      error: null,
      deadlines: cur.deadlines.map(d => (d.id === id ? optimistic : d)),
      deadlineWritePending: { ...cur.deadlineWritePending, [id]: 'update' },
    });

    this.api
      .update(id, dto, { idempotencyKey: idem })
      .pipe(
        tap(raw => {
          const updated = reviveDeadline(raw);
          this.clearDedupForDeadline(id);
          this.patchState({
            deadlines: this.state.value.deadlines.map(d => (d.id === id ? updated : d)),
            deadlineWritePending: omitDeadlinePending(this.state.value.deadlineWritePending, id),
          });
          this.events.emit(AppEventType.DEADLINE_UPDATED, this.toPayload(updated));
          this.checkUpcomingDeadlines();
        }),
        catchError((err: { message: string }) => {
          const reverted = reviveDeadline({ ...snapshot, id } as Deadline);
          this.patchState({
            deadlines: this.state.value.deadlines.map(d => (d.id === id ? reverted : d)),
            deadlineWritePending: omitDeadlinePending(this.state.value.deadlineWritePending, id),
            error: err.message,
          });
          this.events.emit(AppEventType.DEADLINE_ERROR, err.message);
          return of(null);
        })
      )
      .subscribe();
  }

  deleteDeadline(id: number): void {
    if (id < 0) {
      this.patchState({
        deadlines: this.state.value.deadlines.filter(d => d.id !== id),
        deadlineWritePending: omitDeadlinePending(this.state.value.deadlineWritePending, id),
      });
      return;
    }

    const removed = this.state.value.deadlines.find(d => d.id === id);
    this.patchState({ error: null });
    this.api
      .delete(id)
      .pipe(
        tap(() => {
          const current = this.state.value;
          this.clearDedupForDeadline(id);
          this.patchState({ deadlines: current.deadlines.filter(d => d.id !== id) });
          this.events.emit(AppEventType.DEADLINE_DELETED, {
            caseId: removed?.caseId ?? 0,
            deadlineId: id,
            title: removed?.title,
            dueDate: removed?.dueDate,
          } satisfies CourtSessionEventPayload);
        }),
        catchError((err: { message: string }) => {
          this.patchState({ error: err.message });
          this.events.emit(AppEventType.DEADLINE_ERROR, err.message);
          return of(null);
        })
      )
      .subscribe();
  }

  checkUpcomingDeadlines(): void {
    const now = Date.now();
    for (const d of this.state.value.deadlines) {
      if (d.id < 0) continue;
      const due = new Date(d.dueDate).getTime();
      if (Number.isNaN(due)) continue;
      const msUntil = due - now;
      if (msUntil <= 0) continue;

      const daysUntil = msUntil / (24 * 60 * 60 * 1000);
      const levels = d.notifiedLevels ?? [];

      if (levels.includes(7) && daysUntil <= 7 && daysUntil > 3) {
        this.emitIfFresh(d, '7d', AppEventType.DEADLINE_APPROACHING);
      }
      if (levels.includes(3) && daysUntil <= 3 && daysUntil > 1) {
        this.emitIfFresh(d, '3d', AppEventType.DEADLINE_WARNING);
      }
      if (levels.includes(1) && msUntil <= 24 * 60 * 60 * 1000) {
        this.emitIfFresh(d, '24h', AppEventType.DEADLINE_CRITICAL);
      }
    }
  }

  private emitIfFresh(deadline: Deadline, window: AlertWindow, type: AppEventType): void {
    const key = `${deadline.id}:${window}:${deadline.dueDate.toISOString()}`;
    if (this.alertDedup.has(key)) return;
    this.alertDedup.add(key);
    const base = this.toPayload(deadline);
    this.events.emit(type, { ...base, alertWindow: window });
  }

  private clearDedupForDeadline(id: number): void {
    for (const k of [...this.alertDedup]) {
      if (k.startsWith(`${id}:`)) this.alertDedup.delete(k);
    }
  }

  private toPayload(deadline: Deadline): CourtSessionEventPayload {
    return {
      caseId: deadline.caseId,
      deadlineId: deadline.id,
      title: deadline.title,
      dueDate: deadline.dueDate,
    };
  }

  private patchState(partial: Partial<DeadlinesState>): void {
    this.state.next({ ...this.state.value, ...partial });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
