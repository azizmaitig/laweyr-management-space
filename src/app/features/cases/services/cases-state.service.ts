import { Injectable, inject, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, tap, catchError, of, map, Subscription } from 'rxjs';
import { Case, CaseTimelineEvent, CaseDocument, Task, Note, FinancialEventPayload } from '../../../core/models';
import { CasesApiService, CreateCaseDto, UpdateCaseDto } from './cases-api.service';
import { EventService } from '../../../core/services/event.service';
import { PageParams, PaginatedResponse } from '../../../core/models/api-response.model';
import { AppEventType } from '../../../core/models/events.model';

export interface CasesState {
  cases: Case[];
  loading: boolean;
  error: string | null;
  selectedCase: Case | null;
  pagination: { page: number; size: number; total: number; totalPages: number };
  /** Expense rollups per case (from EXPENSES_LOADED / EXPENSE_ADDED / EXPENSE_DELETED). */
  caseExpenseTotalByCaseId: Record<number, number>;
}

const initialState: CasesState = {
  cases: [],
  loading: false,
  error: null,
  selectedCase: null,
  pagination: { page: 0, size: 20, total: 0, totalPages: 0 },
  caseExpenseTotalByCaseId: {},
};

@Injectable({ providedIn: 'root' })
export class CasesStateService implements OnDestroy {
  private api = inject(CasesApiService);
  private events = inject(EventService);

  private state = new BehaviorSubject<CasesState>(initialState);
  state$ = this.state.asObservable();

  // Cross-feature event subscriptions
  private subscriptions = new Subscription();

  constructor() {
    this.setupEventListeners();
  }

  /**
   * Setup cross-feature event listeners
   * This service ONLY listens to events - it never calls other services directly
   */
  private setupEventListeners(): void {
    // When a task is completed → emit event for timeline to handle
    this.subscriptions.add(
      this.events.on<{ caseId: number; taskTitle: string }>(AppEventType.TASK_COMPLETED)
        .subscribe(({ caseId, taskTitle }) => {
          console.log(`[CasesState] Task completed: ${taskTitle} for case ${caseId}`);
          // TimelineStateService will handle this event automatically
        })
    );

    // When a document is uploaded → emit event for timeline to handle
    this.subscriptions.add(
      this.events.on<{ caseId: number; documentId: number; name: string }>(AppEventType.DOCUMENT_UPLOADED)
        .subscribe(({ caseId, name }) => {
          console.log(`[CasesState] Document uploaded: ${name} for case ${caseId}`);
          // TimelineStateService will handle this event automatically
        })
    );

    // When a note is created → emit event for timeline to handle
    this.subscriptions.add(
      this.events.on<{ caseId: number; noteId: number; title: string; createdAt: string }>(AppEventType.NOTE_ADDED)
        .subscribe(({ caseId, title }) => {
          console.log(`[CasesState] Note created: ${title} for case ${caseId}`);
          // TimelineStateService will handle this event automatically
        })
    );

    // When a case is updated → refresh if it's the selected case
    this.subscriptions.add(
      this.events.on<number>(AppEventType.CASE_UPDATED)
        .subscribe(caseId => {
          if (this.state.value.selectedCase?.id === caseId) {
            this.loadCase(caseId);
          }
        })
    );

    this.subscriptions.add(
      this.events
        .on<{ caseId: number; count: number; expenseTotal: number }>(AppEventType.EXPENSES_LOADED)
        .subscribe(({ caseId, expenseTotal }) => {
          const next = { ...this.state.value.caseExpenseTotalByCaseId, [caseId]: expenseTotal };
          this.patchState({ caseExpenseTotalByCaseId: next });
        })
    );

    this.subscriptions.add(
      this.events.on<FinancialEventPayload>(AppEventType.EXPENSE_ADDED).subscribe(p => {
        const next = { ...this.state.value.caseExpenseTotalByCaseId };
        next[p.caseId] = (next[p.caseId] ?? 0) + p.amount;
        this.patchState({ caseExpenseTotalByCaseId: next });
      })
    );

    this.subscriptions.add(
      this.events
        .on<{ caseId: number; expenseId: number; category?: string; amount: number }>(
          AppEventType.EXPENSE_DELETED
        )
        .subscribe(({ caseId, amount }) => {
          const next = { ...this.state.value.caseExpenseTotalByCaseId };
          next[caseId] = Math.max(0, (next[caseId] ?? 0) - amount);
          this.patchState({ caseExpenseTotalByCaseId: next });
        })
    );

    this.subscriptions.add(
      this.events.on<number>(AppEventType.CASE_DELETED).subscribe(caseId => {
        const next = { ...this.state.value.caseExpenseTotalByCaseId };
        delete next[caseId];
        this.patchState({ caseExpenseTotalByCaseId: next });
      })
    );
  }

  // Selectors
  selectCases(): Observable<Case[]> {
    return this.state$.pipe(map(s => s.cases));
  }

  selectLoading(): Observable<boolean> {
    return this.state$.pipe(map(s => s.loading));
  }

  selectError(): Observable<string | null> {
    return this.state$.pipe(map(s => s.error));
  }

  selectSelectedCase(): Observable<Case | null> {
    return this.state$.pipe(map(s => s.selectedCase));
  }

  selectPagination(): Observable<{ page: number; size: number; total: number; totalPages: number }> {
    return this.state$.pipe(map(s => s.pagination));
  }

  selectCaseExpenseTotal(caseId: number): Observable<number> {
    return this.state$.pipe(map(s => s.caseExpenseTotalByCaseId[caseId] ?? 0));
  }

  // Actions
  loadCases(pageParams?: PageParams) {
    this.patchState({ loading: true, error: null });
    
    if (pageParams) {
      this.loadPaginatedCases(pageParams);
    } else {
      this.api.getAll().pipe(
        tap((cases: Case[]) => {
          this.patchState({ cases, loading: false });
          this.events.emit(AppEventType.CASE_LOADED, { count: cases.length });
        }),
        catchError((err: { message: string }) => {
          this.patchState({ loading: false, error: err.message });
          this.events.emit(AppEventType.CASE_ERROR, err.message);
          return of([]);
        })
      ).subscribe();
    }
  }

  private loadPaginatedCases(pageParams: PageParams) {
    this.api.getPaginated(pageParams).pipe(
      tap((response: PaginatedResponse<Case>) => {
        this.patchState({
          cases: response.data,
          loading: false,
          pagination: {
            page: response.page,
            size: response.size,
            total: response.total,
            totalPages: response.totalPages,
          },
        });
        this.events.emit(AppEventType.CASE_LOADED, { count: response.data.length });
      }),
      catchError((err: { message: string }) => {
        this.patchState({ loading: false, error: err.message });
        this.events.emit(AppEventType.CASE_ERROR, err.message);
        return of([]);
      })
    ).subscribe();
  }

  /**
   * Load a single case and emit CASE_SELECTED event
   * Other services (tasks, notes, documents, timeline) will listen to this event
   */
  loadCase(id: number) {
    this.patchState({ loading: true, error: null });
    this.api.getById(id).pipe(
      tap(case_ => {
        this.patchState({ selectedCase: case_, loading: false });
        // Emit event - other services will react to this
        this.events.emit(AppEventType.CASE_SELECTED, case_.id);
      }),
      catchError((err: { message: string }) => {
        this.patchState({ loading: false, error: err.message });
        return of(null);
      })
    ).subscribe();
  }

  createCase(dto: CreateCaseDto) {
    this.api.create(dto).pipe(
      tap(newCase => {
        const current = this.state.value;
        this.state.next({ ...current, cases: [...current.cases, newCase] });
        this.events.emit(AppEventType.CASE_CREATED, newCase.id);
      }),
      catchError((err: { message: string }) => {
        this.events.emit(AppEventType.CASE_ERROR, err.message);
        return of(null);
      })
    ).subscribe();
  }

  updateCase(id: number, dto: UpdateCaseDto) {
    this.api.update(id, dto).pipe(
      tap(updated => {
        const current = this.state.value;
        this.state.next({
          ...current,
          cases: current.cases.map(c => c.id === id ? updated : c),
          selectedCase: current.selectedCase?.id === id ? updated : current.selectedCase,
        });
        this.events.emit(AppEventType.CASE_UPDATED, id);
      }),
      catchError((err: { message: string }) => {
        this.events.emit(AppEventType.CASE_ERROR, err.message);
        return of(null);
      })
    ).subscribe();
  }

  deleteCase(id: number) {
    this.api.remove(id).pipe(
      tap(() => {
        const current = this.state.value;
        this.state.next({
          ...current,
          cases: current.cases.filter(c => c.id !== id),
          selectedCase: current.selectedCase?.id === id ? null : current.selectedCase,
        });
        this.events.emit(AppEventType.CASE_DELETED, id);
      }),
      catchError((err: { message: string }) => {
        this.events.emit(AppEventType.CASE_ERROR, err.message);
        return of(null);
      })
    ).subscribe();
  }

  clearSelection() {
    const current = this.state.value;
    this.state.next({
      ...current,
      selectedCase: null,
    });
  }

  private patchState(partial: Partial<CasesState>) {
    const current = this.state.value;
    this.state.next({ ...current, ...partial });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
