import { Injectable, inject, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, catchError, map, of, tap } from 'rxjs';
import { FinancialEventPayload, TimeEntry } from '../../../core/models';
import { AppEventType } from '../../../core/models/events.model';
import { EventService } from '../../../core/services/event.service';
import { CreateTimeEntryDto, TimeTrackingApiService, UpdateTimeEntryDto } from './time-tracking-api.service';

export interface ActiveTimer {
  caseId: number;
  clientId: number;
  taskId?: number;
  hourlyRate: number;
  description: string;
  startedAtMs: number;
}

export interface TimeTrackingState {
  entries: TimeEntry[];
  activeTimer: ActiveTimer | null;
  loading: boolean;
  error: string | null;
}

const initialState: TimeTrackingState = {
  entries: [],
  activeTimer: null,
  loading: false,
  error: null,
};

@Injectable({ providedIn: 'root' })
export class TimeTrackingStateService implements OnDestroy {
  private api = inject(TimeTrackingApiService);
  private events = inject(EventService);
  private state = new BehaviorSubject<TimeTrackingState>(initialState);
  state$ = this.state.asObservable();

  private subscriptions = new Subscription();

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.subscriptions.add(
      this.events.on<number>(AppEventType.CASE_SELECTED).subscribe(caseId => this.loadTimeEntries(caseId))
    );
    this.subscriptions.add(
      this.events.on(AppEventType.CASE_DELETED).subscribe(() =>
        this.patchState({ entries: [], activeTimer: null })
      )
    );
  }

  selectTimeEntries(caseId: number): Observable<TimeEntry[]> {
    return this.state$.pipe(map(s => s.entries.filter(e => e.caseId === caseId)));
  }

  selectActiveTimer(): Observable<ActiveTimer | null> {
    return this.state$.pipe(map(s => s.activeTimer));
  }

  selectLoading(): Observable<boolean> {
    return this.state$.pipe(map(s => s.loading));
  }

  selectError(): Observable<string | null> {
    return this.state$.pipe(map(s => s.error));
  }

  loadTimeEntries(caseId: number): void {
    this.patchState({ loading: true, error: null });
    this.api.getByCase(caseId).pipe(
      tap(entries => {
        const billableTotal = entries.reduce((sum, e) => sum + e.amount, 0);
        this.patchState({ entries, loading: false });
        this.events.emit(AppEventType.TIME_ENTRIES_LOADED, { caseId, count: entries.length, billableTotal });
      }),
      catchError((err: { message: string }) => {
        this.patchState({ loading: false, error: err.message });
        this.events.emit(AppEventType.TIME_ENTRY_ERROR, err.message);
        return of([]);
      })
    ).subscribe();
  }

  startTimer(params: {
    caseId: number;
    clientId: number;
    hourlyRate: number;
    taskId?: number;
    description?: string;
  }): void {
    const timer: ActiveTimer = {
      caseId: params.caseId,
      clientId: params.clientId,
      taskId: params.taskId,
      hourlyRate: params.hourlyRate,
      description: params.description?.trim() ?? '',
      startedAtMs: Date.now(),
    };
    this.patchState({ activeTimer: timer, error: null });
  }

  stopTimer(): void {
    const timer = this.state.value.activeTimer;
    if (!timer) return;

    const elapsedMs = Date.now() - timer.startedAtMs;
    const duration = Math.max(1, Math.round(elapsedMs / 60_000));
    const amount = Math.round((duration / 60) * timer.hourlyRate * 100) / 100;

    const dto: CreateTimeEntryDto = {
      caseId: timer.caseId,
      taskId: timer.taskId,
      description: timer.description || 'Timed session',
      duration,
      hourlyRate: timer.hourlyRate,
      amount,
    };

    this.patchState({ activeTimer: null });
    this.createTimeEntry(dto, { clientId: timer.clientId, source: 'timer' });
  }

  createTimeEntry(dto: CreateTimeEntryDto, context?: { clientId?: number; source?: 'timer' | 'form' }): void {
    this.patchState({ error: null });
    this.api.create(dto).pipe(
      tap(entry => {
        const current = this.state.value;
        this.patchState({ entries: [entry, ...current.entries] });
        const payload: FinancialEventPayload = {
          caseId: entry.caseId,
          clientId: context?.clientId ?? 0,
          amount: entry.amount,
          metadata: {
            timeEntryId: entry.id,
            description: entry.description,
            durationMinutes: entry.duration,
            hourlyRate: entry.hourlyRate,
            source: context?.source ?? 'form',
          },
        };
        this.events.emit(AppEventType.TIME_ENTRY_ADDED, payload);
      }),
      catchError((err: { message: string }) => {
        this.patchState({ error: err.message });
        this.events.emit(AppEventType.TIME_ENTRY_ERROR, err.message);
        return of(null);
      })
    ).subscribe();
  }

  updateTimeEntry(id: number, dto: UpdateTimeEntryDto): void {
    this.patchState({ error: null });
    this.api.update(id, dto).pipe(
      tap(updated => {
        const current = this.state.value;
        this.patchState({ entries: current.entries.map(e => (e.id === id ? updated : e)) });
        this.events.emit(AppEventType.TIME_ENTRY_UPDATED, {
          caseId: updated.caseId,
          timeEntryId: updated.id,
          description: updated.description,
        });
      }),
      catchError((err: { message: string }) => {
        this.patchState({ error: err.message });
        this.events.emit(AppEventType.TIME_ENTRY_ERROR, err.message);
        return of(null);
      })
    ).subscribe();
  }

  deleteTimeEntry(id: number): void {
    const removed = this.state.value.entries.find(e => e.id === id);
    this.patchState({ loading: true, error: null });
    this.api.delete(id).pipe(
      tap(() => {
        const current = this.state.value;
        this.patchState({
          entries: current.entries.filter(e => e.id !== id),
          loading: false,
        });
        this.events.emit(AppEventType.TIME_ENTRY_DELETED, {
          caseId: removed?.caseId ?? 0,
          timeEntryId: id,
          description: removed?.description ?? '',
        });
      }),
      catchError((err: { message: string }) => {
        this.patchState({ loading: false, error: err.message });
        this.events.emit(AppEventType.TIME_ENTRY_ERROR, err.message);
        return of(null);
      })
    ).subscribe();
  }

  private patchState(partial: Partial<TimeTrackingState>): void {
    this.state.next({ ...this.state.value, ...partial });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
