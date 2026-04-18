import { Injectable, inject, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, catchError, map, of, tap } from 'rxjs';
import { FinancialEventPayload, Invoice } from '../../../core/models';
import { AppEventType } from '../../../core/models/events.model';
import { EventService } from '../../../core/services/event.service';
import { CreateInvoiceDto, InvoicesApiService, UpdateInvoiceDto } from './invoices-api.service';

export interface InvoicesState {
  invoices: Invoice[];
  /** Running billable total per case (from time entries; updated via events). */
  billableAccruedByCaseId: Record<number, number>;
  loading: boolean;
  error: string | null;
}

const initialState: InvoicesState = {
  invoices: [],
  billableAccruedByCaseId: {},
  loading: false,
  error: null,
};

function invoiceToFinancialPayload(invoice: Invoice, extra?: Record<string, unknown>): FinancialEventPayload {
  return {
    caseId: invoice.caseId,
    clientId: invoice.clientId,
    amount: invoice.amount,
    metadata: {
      invoiceId: invoice.id,
      number: invoice.number,
      status: invoice.status,
      ...extra,
    },
  };
}

@Injectable({ providedIn: 'root' })
export class InvoicesStateService implements OnDestroy {
  private api = inject(InvoicesApiService);
  private events = inject(EventService);
  private state = new BehaviorSubject<InvoicesState>(initialState);
  state$ = this.state.asObservable();

  private subscriptions = new Subscription();

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.subscriptions.add(
      this.events.on<number>(AppEventType.CASE_SELECTED).subscribe(caseId => this.loadInvoices(caseId))
    );
    this.subscriptions.add(
      this.events.on(AppEventType.CASE_DELETED).subscribe(() =>
        this.patchState({ invoices: [], billableAccruedByCaseId: {} })
      )
    );

    this.subscriptions.add(
      this.events
        .on<{ caseId: number; count: number; billableTotal: number }>(AppEventType.TIME_ENTRIES_LOADED)
        .subscribe(({ caseId, billableTotal }) => {
          const next = { ...this.state.value.billableAccruedByCaseId, [caseId]: billableTotal };
          this.patchState({ billableAccruedByCaseId: next });
        })
    );

    this.subscriptions.add(
      this.events.on<FinancialEventPayload>(AppEventType.TIME_ENTRY_ADDED).subscribe(p => {
        const next = { ...this.state.value.billableAccruedByCaseId };
        next[p.caseId] = (next[p.caseId] ?? 0) + p.amount;
        this.patchState({ billableAccruedByCaseId: next });
      })
    );
  }

  selectInvoices(caseId: number): Observable<Invoice[]> {
    return this.state$.pipe(map(s => s.invoices.filter(i => i.caseId === caseId)));
  }

  selectBillableAccrued(caseId: number): Observable<number> {
    return this.state$.pipe(map(s => s.billableAccruedByCaseId[caseId] ?? 0));
  }

  selectLoading(): Observable<boolean> {
    return this.state$.pipe(map(s => s.loading));
  }

  selectError(): Observable<string | null> {
    return this.state$.pipe(map(s => s.error));
  }

  loadInvoices(caseId: number): void {
    this.patchState({ loading: true, error: null });
    this.api.getByCase(caseId).pipe(
      tap(invoices => {
        this.patchState({ invoices, loading: false });
        this.events.emit(AppEventType.INVOICES_LOADED, { caseId, count: invoices.length });
      }),
      catchError((err: { message: string }) => {
        this.patchState({ loading: false, error: err.message });
        this.events.emit(AppEventType.INVOICE_ERROR, err.message);
        return of([]);
      })
    ).subscribe();
  }

  createInvoice(dto: CreateInvoiceDto): void {
    this.patchState({ error: null });
    this.api.create(dto).pipe(
      tap(invoice => {
        const current = this.state.value;
        this.patchState({ invoices: [invoice, ...current.invoices] });
        this.events.emit(AppEventType.INVOICE_CREATED, invoiceToFinancialPayload(invoice));
      }),
      catchError((err: { message: string }) => {
        this.patchState({ error: err.message });
        this.events.emit(AppEventType.INVOICE_ERROR, err.message);
        return of(null);
      })
    ).subscribe();
  }

  sendInvoice(id: number): void {
    const existing = this.state.value.invoices.find(i => i.id === id);
    if (!existing) return;
    this.patchState({ error: null });
    this.api.update(id, { status: 'SENT' }).pipe(
      tap(updated => {
        const current = this.state.value;
        this.patchState({ invoices: current.invoices.map(i => (i.id === id ? updated : i)) });
        this.events.emit(AppEventType.INVOICE_SENT, invoiceToFinancialPayload(updated, { action: 'send' }));
      }),
      catchError((err: { message: string }) => {
        this.patchState({ error: err.message });
        this.events.emit(AppEventType.INVOICE_ERROR, err.message);
        return of(null);
      })
    ).subscribe();
  }

  markAsPaid(id: number): void {
    const existing = this.state.value.invoices.find(i => i.id === id);
    if (!existing) return;
    this.patchState({ error: null });
    this.api.update(id, { status: 'PAID' }).pipe(
      tap(updated => {
        const current = this.state.value;
        this.patchState({ invoices: current.invoices.map(i => (i.id === id ? updated : i)) });
        this.events.emit(AppEventType.INVOICE_PAID, invoiceToFinancialPayload(updated, { action: 'markPaid' }));
      }),
      catchError((err: { message: string }) => {
        this.patchState({ error: err.message });
        this.events.emit(AppEventType.INVOICE_ERROR, err.message);
        return of(null);
      })
    ).subscribe();
  }

  updateInvoice(id: number, dto: UpdateInvoiceDto): void {
    this.patchState({ error: null });
    this.api.update(id, dto).pipe(
      tap(updated => {
        const current = this.state.value;
        this.patchState({ invoices: current.invoices.map(i => (i.id === id ? updated : i)) });
        this.events.emit(AppEventType.INVOICE_UPDATED, {
          caseId: updated.caseId,
          invoiceId: updated.id,
          number: updated.number,
        });
      }),
      catchError((err: { message: string }) => {
        this.patchState({ error: err.message });
        this.events.emit(AppEventType.INVOICE_ERROR, err.message);
        return of(null);
      })
    ).subscribe();
  }

  deleteInvoice(id: number): void {
    const removed = this.state.value.invoices.find(i => i.id === id);
    this.patchState({ loading: true, error: null });
    this.api.delete(id).pipe(
      tap(() => {
        const current = this.state.value;
        this.patchState({
          invoices: current.invoices.filter(i => i.id !== id),
          loading: false,
        });
        this.events.emit(AppEventType.INVOICE_DELETED, {
          caseId: removed?.caseId ?? 0,
          invoiceId: id,
          number: removed?.number ?? '',
        });
      }),
      catchError((err: { message: string }) => {
        this.patchState({ loading: false, error: err.message });
        this.events.emit(AppEventType.INVOICE_ERROR, err.message);
        return of(null);
      })
    ).subscribe();
  }

  private patchState(partial: Partial<InvoicesState>): void {
    this.state.next({ ...this.state.value, ...partial });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
