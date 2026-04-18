import { Injectable, inject, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, catchError, map, of, tap } from 'rxjs';
import type { SessionPreparation } from '../../../core/models';
import { AppEventType } from '../../../core/models/events.model';
import { EventService } from '../../../core/services/event.service';
import { newClientRequestId } from '../court-sessions-request.util';
import { revivePreparation } from '../court-sessions-dates.util';
import { PreparationApiService } from './preparation-api.service';

export type PreparationWriteKind = 'create' | 'update';

export interface PreparationState {
  preparations: SessionPreparation[];
  loading: boolean;
  error: string | null;
  preparationWritePending: Record<number, PreparationWriteKind>;
  /** sessionId → save in flight (create or update) */
  preparationSavePendingSessionIds: Record<number, true>;
}

const initialState: PreparationState = {
  preparations: [],
  loading: false,
  error: null,
  preparationWritePending: {},
  preparationSavePendingSessionIds: {},
};

function clonePreparation(p: SessionPreparation): SessionPreparation {
  return {
    ...p,
    checklist: [...p.checklist],
    createdAt: new Date(p.createdAt),
  };
}

function omitPrepPending(
  pending: Record<number, PreparationWriteKind>,
  id: number
): Record<number, PreparationWriteKind> {
  const { [id]: _, ...rest } = pending;
  return rest;
}

function omitSessionPending(
  m: Record<number, true>,
  sessionId: number
): Record<number, true> {
  const { [sessionId]: _, ...rest } = m;
  return rest;
}

@Injectable({ providedIn: 'root' })
export class PreparationStateService implements OnDestroy {
  private api = inject(PreparationApiService);
  private events = inject(EventService);
  private state = new BehaviorSubject<PreparationState>(initialState);
  state$ = this.state.asObservable();

  private subscriptions = new Subscription();
  private tempPrepCounter = 0;
  private preparationCaseId: number | null = null;

  constructor() {
    this.setupEventListeners();
  }

  private nextTempPreparationId(): number {
    return --this.tempPrepCounter;
  }

  private setupEventListeners(): void {
    this.subscriptions.add(
      this.events.on<number>(AppEventType.CASE_SELECTED).subscribe(caseId => this.loadPreparations(caseId))
    );
    this.subscriptions.add(
      this.events.on(AppEventType.CASE_DELETED).subscribe(() => {
        this.preparationCaseId = null;
        this.patchState({
          preparations: [],
          preparationWritePending: {},
          preparationSavePendingSessionIds: {},
        });
      })
    );
  }

  selectPreparations(): Observable<SessionPreparation[]> {
    return this.state$.pipe(map(s => s.preparations));
  }

  selectPreparationWritePending(): Observable<Record<number, PreparationWriteKind>> {
    return this.state$.pipe(map(s => s.preparationWritePending));
  }

  selectPreparationSavePendingSessions(): Observable<Record<number, true>> {
    return this.state$.pipe(map(s => s.preparationSavePendingSessionIds));
  }

  selectLoading(): Observable<boolean> {
    return this.state$.pipe(map(s => s.loading));
  }

  selectError(): Observable<string | null> {
    return this.state$.pipe(map(s => s.error));
  }

  loadPreparations(caseId: number): void {
    if (this.preparationCaseId !== caseId) {
      this.preparationCaseId = caseId;
      this.patchState({
        preparations: [],
        preparationWritePending: {},
        preparationSavePendingSessionIds: {},
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
          const server = raw.map(revivePreparation);
          const optimistic = this.state.value.preparations.filter(p => p.id < 0);
          this.patchState({
            preparations: [...optimistic, ...server],
            loading: false,
          });
          this.events.emit(AppEventType.PREPARATIONS_LOADED, { caseId, count: server.length });
        }),
        catchError((err: { message: string }) => {
          this.patchState({ loading: false, error: err.message });
          this.events.emit(AppEventType.PREPARATION_ERROR, err.message);
          return of([] as SessionPreparation[]);
        })
      )
      .subscribe();
  }

  savePreparation(sessionId: number, checklist: string[], notes: string): void {
    const existing = this.state.value.preparations.find(p => p.sessionId === sessionId);
    const idem = newClientRequestId();
    const markSessionPending = (on: boolean) => {
      const cur = this.state.value.preparationSavePendingSessionIds;
      const next = on
        ? { ...cur, [sessionId]: true as const }
        : omitSessionPending(cur, sessionId);
      this.patchState({ preparationSavePendingSessionIds: next });
    };

    if (existing) {
      const snapshot = clonePreparation(existing);
      const optimistic = revivePreparation({
        ...snapshot,
        checklist: [...checklist],
        notes,
      });
      const prepId = existing.id;
      this.patchState({
        error: null,
        preparations: this.state.value.preparations.map(p => (p.id === prepId ? optimistic : p)),
        preparationWritePending: { ...this.state.value.preparationWritePending, [prepId]: 'update' },
      });
      markSessionPending(true);

      this.api
        .update(prepId, { checklist, notes }, { idempotencyKey: idem })
        .pipe(
          tap(raw => {
            const updated = revivePreparation(raw);
            markSessionPending(false);
            this.patchState({
              preparations: this.state.value.preparations.map(p => (p.id === updated.id ? updated : p)),
              preparationWritePending: omitPrepPending(this.state.value.preparationWritePending, prepId),
            });
            this.events.emit(AppEventType.PREPARATION_SAVED, { sessionId, preparationId: updated.id });
          }),
          catchError((err: { message: string }) => {
            markSessionPending(false);
            this.patchState({
              preparations: this.state.value.preparations.map(p =>
                p.id === prepId ? revivePreparation(snapshot) : p
              ),
              preparationWritePending: omitPrepPending(this.state.value.preparationWritePending, prepId),
              error: err.message,
            });
            this.events.emit(AppEventType.PREPARATION_ERROR, err.message);
            return of(null);
          })
        )
        .subscribe();
      return;
    }

    const tempId = this.nextTempPreparationId();
    const optimistic = revivePreparation({
      id: tempId,
      sessionId,
      checklist: [...checklist],
      notes,
      createdAt: new Date(),
    });

    this.patchState({
      error: null,
      preparations: [optimistic, ...this.state.value.preparations],
      preparationWritePending: { ...this.state.value.preparationWritePending, [tempId]: 'create' },
    });
    markSessionPending(true);

    this.api
      .create(
        {
          sessionId,
          checklist,
          notes,
          createdAt: new Date(),
        },
        { idempotencyKey: idem }
      )
      .pipe(
        tap(raw => {
          const created = revivePreparation(raw);
          markSessionPending(false);
          this.patchState({
            preparations: this.state.value.preparations.map(p => (p.id === tempId ? created : p)),
            preparationWritePending: omitPrepPending(this.state.value.preparationWritePending, tempId),
          });
          this.events.emit(AppEventType.PREPARATION_SAVED, { sessionId, preparationId: created.id });
        }),
        catchError((err: { message: string }) => {
          markSessionPending(false);
          this.patchState({
            preparations: this.state.value.preparations.filter(p => p.id !== tempId),
            preparationWritePending: omitPrepPending(this.state.value.preparationWritePending, tempId),
            error: err.message,
          });
          this.events.emit(AppEventType.PREPARATION_ERROR, err.message);
          return of(null);
        })
      )
      .subscribe();
  }

  private patchState(partial: Partial<PreparationState>): void {
    this.state.next({ ...this.state.value, ...partial });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
