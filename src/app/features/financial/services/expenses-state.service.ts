import { Injectable, inject, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, catchError, map, of, tap } from 'rxjs';
import { Expense, FinancialEventPayload } from '../../../core/models';
import { AppEventType } from '../../../core/models/events.model';
import { EventService } from '../../../core/services/event.service';
import { CreateExpenseDto, ExpensesApiService, UpdateExpenseDto } from './expenses-api.service';

export interface ExpensesState {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
}

const initialState: ExpensesState = { expenses: [], loading: false, error: null };

@Injectable({ providedIn: 'root' })
export class ExpensesStateService implements OnDestroy {
  private api = inject(ExpensesApiService);
  private events = inject(EventService);
  private state = new BehaviorSubject<ExpensesState>(initialState);
  state$ = this.state.asObservable();

  private subscriptions = new Subscription();

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.subscriptions.add(
      this.events.on<number>(AppEventType.CASE_SELECTED).subscribe(caseId => this.loadExpenses(caseId))
    );
    this.subscriptions.add(
      this.events.on(AppEventType.CASE_DELETED).subscribe(() => this.patchState({ expenses: [] }))
    );
  }

  selectExpenses(caseId: number): Observable<Expense[]> {
    return this.state$.pipe(map(s => s.expenses.filter(e => e.caseId === caseId)));
  }

  selectLoading(): Observable<boolean> {
    return this.state$.pipe(map(s => s.loading));
  }

  selectError(): Observable<string | null> {
    return this.state$.pipe(map(s => s.error));
  }

  loadExpenses(caseId: number): void {
    this.patchState({ loading: true, error: null });
    this.api.getByCase(caseId).pipe(
      tap(expenses => {
        const expenseTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
        this.patchState({ expenses, loading: false });
        this.events.emit(AppEventType.EXPENSES_LOADED, { caseId, count: expenses.length, expenseTotal });
      }),
      catchError((err: { message: string }) => {
        this.patchState({ loading: false, error: err.message });
        this.events.emit(AppEventType.EXPENSE_ERROR, err.message);
        return of([]);
      })
    ).subscribe();
  }

  /** @see addExpense */
  createExpense(dto: CreateExpenseDto, context?: { clientId?: number }): void {
    this.addExpense(dto, context);
  }

  addExpense(dto: CreateExpenseDto, context?: { clientId?: number }): void {
    this.patchState({ error: null });
    this.api.create(dto).pipe(
      tap(expense => {
        const current = this.state.value;
        this.patchState({ expenses: [expense, ...current.expenses] });
        const payload: FinancialEventPayload = {
          caseId: expense.caseId,
          clientId: context?.clientId ?? 0,
          amount: expense.amount,
          metadata: {
            expenseId: expense.id,
            category: expense.category,
            date: expense.date,
            documentUrl: expense.documentUrl,
          },
        };
        this.events.emit(AppEventType.EXPENSE_ADDED, payload);
      }),
      catchError((err: { message: string }) => {
        this.patchState({ error: err.message });
        this.events.emit(AppEventType.EXPENSE_ERROR, err.message);
        return of(null);
      })
    ).subscribe();
  }

  updateExpense(id: number, dto: UpdateExpenseDto): void {
    this.patchState({ error: null });
    this.api.update(id, dto).pipe(
      tap(updated => {
        const current = this.state.value;
        this.patchState({ expenses: current.expenses.map(e => (e.id === id ? updated : e)) });
        this.events.emit(AppEventType.EXPENSE_UPDATED, {
          caseId: updated.caseId,
          expenseId: updated.id,
          category: updated.category,
          amount: updated.amount,
        });
      }),
      catchError((err: { message: string }) => {
        this.patchState({ error: err.message });
        this.events.emit(AppEventType.EXPENSE_ERROR, err.message);
        return of(null);
      })
    ).subscribe();
  }

  deleteExpense(id: number): void {
    const removed = this.state.value.expenses.find(e => e.id === id);
    this.patchState({ loading: true, error: null });
    this.api.delete(id).pipe(
      tap(() => {
        const current = this.state.value;
        this.patchState({
          expenses: current.expenses.filter(e => e.id !== id),
          loading: false,
        });
        this.events.emit(AppEventType.EXPENSE_DELETED, {
          caseId: removed?.caseId ?? 0,
          expenseId: id,
          category: removed?.category,
          amount: removed?.amount ?? 0,
        });
      }),
      catchError((err: { message: string }) => {
        this.patchState({ loading: false, error: err.message });
        this.events.emit(AppEventType.EXPENSE_ERROR, err.message);
        return of(null);
      })
    ).subscribe();
  }

  private patchState(partial: Partial<ExpensesState>): void {
    this.state.next({ ...this.state.value, ...partial });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
