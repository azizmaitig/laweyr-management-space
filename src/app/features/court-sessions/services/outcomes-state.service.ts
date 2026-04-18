import { Injectable, inject, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, catchError, map, of, switchMap, tap } from 'rxjs';
import type { CourtSessionEventPayload, SessionOutcome } from '../../../core/models';
import { AppEventType } from '../../../core/models/events.model';
import { EventService } from '../../../core/services/event.service';
import { newClientRequestId } from '../court-sessions-request.util';
import { reviveOutcome, reviveSession } from '../court-sessions-dates.util';
import { CreateSessionOutcomeDto, OutcomesApiService } from './outcomes-api.service';
import { SessionsApiService } from './sessions-api.service';

export type OutcomeWriteKind = 'create' | 'update';

export interface OutcomesState {
  outcomes: SessionOutcome[];
  loading: boolean;
  error: string | null;
  outcomeWritePending: Record<number, OutcomeWriteKind>;
  outcomeRecordPendingSessionIds: Record<number, true>;
}

const initialState: OutcomesState = {
  outcomes: [],
  loading: false,
  error: null,
  outcomeWritePending: {},
  outcomeRecordPendingSessionIds: {},
};

function omitOutcomePending(
  pending: Record<number, OutcomeWriteKind>,
  id: number
): Record<number, OutcomeWriteKind> {
  const { [id]: _, ...rest } = pending;
  return rest;
}

function omitOutcomeSessionPending(m: Record<number, true>, sessionId: number): Record<number, true> {
  const { [sessionId]: _, ...rest } = m;
  return rest;
}

@Injectable({ providedIn: 'root' })
export class OutcomesStateService implements OnDestroy {
  private api = inject(OutcomesApiService);
  private sessionsApi = inject(SessionsApiService);
  private events = inject(EventService);
  private state = new BehaviorSubject<OutcomesState>(initialState);
  state$ = this.state.asObservable();

  private subscriptions = new Subscription();
  private tempOutcomeCounter = 0;
  private outcomeCaseId: number | null = null;

  constructor() {
    this.setupEventListeners();
  }

  private nextTempOutcomeId(): number {
    return --this.tempOutcomeCounter;
  }

  private setupEventListeners(): void {
    this.subscriptions.add(
      this.events.on<number>(AppEventType.CASE_SELECTED).subscribe(caseId => this.loadOutcomes(caseId))
    );
    this.subscriptions.add(
      this.events.on(AppEventType.CASE_DELETED).subscribe(() => {
        this.outcomeCaseId = null;
        this.patchState({
          outcomes: [],
          outcomeWritePending: {},
          outcomeRecordPendingSessionIds: {},
        });
      })
    );
  }

  selectOutcomes(): Observable<SessionOutcome[]> {
    return this.state$.pipe(map(s => s.outcomes));
  }

  selectOutcomeWritePending(): Observable<Record<number, OutcomeWriteKind>> {
    return this.state$.pipe(map(s => s.outcomeWritePending));
  }

  selectOutcomeRecordPendingSessions(): Observable<Record<number, true>> {
    return this.state$.pipe(map(s => s.outcomeRecordPendingSessionIds));
  }

  selectLoading(): Observable<boolean> {
    return this.state$.pipe(map(s => s.loading));
  }

  selectError(): Observable<string | null> {
    return this.state$.pipe(map(s => s.error));
  }

  loadOutcomes(caseId: number): void {
    if (this.outcomeCaseId !== caseId) {
      this.outcomeCaseId = caseId;
      this.patchState({
        outcomes: [],
        outcomeWritePending: {},
        outcomeRecordPendingSessionIds: {},
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
          const server = raw.map(reviveOutcome);
          const optimistic = this.state.value.outcomes.filter(o => o.id < 0);
          this.patchState({
            outcomes: [...optimistic, ...server],
            loading: false,
          });
          this.events.emit(AppEventType.OUTCOMES_LOADED, { caseId, count: server.length });
        }),
        catchError((err: { message: string }) => {
          this.patchState({ loading: false, error: err.message });
          this.events.emit(AppEventType.OUTCOME_ERROR, err.message);
          return of([] as SessionOutcome[]);
        })
      )
      .subscribe();
  }

  recordOutcome(dto: CreateSessionOutcomeDto): void {
    const sessionId = dto.sessionId;
    this.patchState({
      error: null,
      outcomeRecordPendingSessionIds: {
        ...this.state.value.outcomeRecordPendingSessionIds,
        [sessionId]: true,
      },
    });

    this.sessionsApi
      .getById(sessionId)
      .pipe(
        switchMap(rawSession => {
          const session = reviveSession(rawSession);
          const tempId = this.nextTempOutcomeId();
          const idem = newClientRequestId();
          const optimistic = reviveOutcome({
            id: tempId,
            sessionId: dto.sessionId,
            result: dto.result,
            summary: dto.summary,
            nextSessionDate: dto.nextSessionDate,
            createdAt: new Date(),
          } as SessionOutcome);

          this.patchState({
            outcomes: [optimistic, ...this.state.value.outcomes],
            outcomeWritePending: { ...this.state.value.outcomeWritePending, [tempId]: 'create' },
          });

          return this.api.create(dto, { idempotencyKey: idem }).pipe(
            map(outcome => ({ session, outcome: reviveOutcome(outcome), tempId }))
          );
        }),
        tap(({ session, outcome, tempId }) => {
          this.patchState({
            outcomes: this.state.value.outcomes.map(o => (o.id === tempId ? outcome : o)),
            outcomeWritePending: omitOutcomePending(this.state.value.outcomeWritePending, tempId),
            outcomeRecordPendingSessionIds: omitOutcomeSessionPending(
              this.state.value.outcomeRecordPendingSessionIds,
              sessionId
            ),
          });
          const payload: CourtSessionEventPayload = {
            caseId: session.caseId,
            sessionId: outcome.sessionId,
            date: session.date,
            result: outcome.result,
            nextSessionDate: outcome.nextSessionDate,
            court: session.court,
            type: session.type,
          };
          this.events.emit(AppEventType.SESSION_OUTCOME_RECORDED, payload);
        }),
        catchError((err: { message: string }) => {
          const st = this.state.value;
          const tempRow = st.outcomes.find(o => o.id < 0 && o.sessionId === sessionId);
          const tempId = tempRow?.id;
          this.patchState({
            outcomes: tempId != null ? st.outcomes.filter(o => o.id !== tempId) : st.outcomes,
            outcomeWritePending:
              tempId != null ? omitOutcomePending(st.outcomeWritePending, tempId) : st.outcomeWritePending,
            outcomeRecordPendingSessionIds: omitOutcomeSessionPending(
              st.outcomeRecordPendingSessionIds,
              sessionId
            ),
            error: err.message,
          });
          this.events.emit(AppEventType.OUTCOME_ERROR, err.message);
          return of(null);
        })
      )
      .subscribe();
  }

  private patchState(partial: Partial<OutcomesState>): void {
    this.state.next({ ...this.state.value, ...partial });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
