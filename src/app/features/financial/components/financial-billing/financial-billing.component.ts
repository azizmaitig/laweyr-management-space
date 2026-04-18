import { Component, effect, inject, input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { distinctUntilChanged, map, switchMap, of, combineLatest, Observable, take } from 'rxjs';
import { CasesStateService } from '../../../cases/services/cases-state.service';
import { ClientsStateService } from '../../../clients/services/clients-state.service';
import { ExpensesStateService } from '../../services/expenses-state.service';
import { InvoicesStateService } from '../../services/invoices-state.service';
import { TimeTrackingStateService } from '../../services/time-tracking-state.service';
import { WORKSPACE_QUERY } from '../../../../core/constants/workspace-query-params';
import {
  Case,
  ExpenseCategory,
  Invoice,
  InvoiceStatus,
} from '../../../../core/models';

type BillingTab = 'invoices' | 'time' | 'expenses';

@Component({
  selector: 'app-financial-billing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './financial-billing.component.html',
  styleUrl: './financial-billing.component.scss',
})
export class FinancialBillingComponent implements OnInit {
  protected casesState = inject(CasesStateService);
  private clientsState = inject(ClientsStateService);
  protected invoicesState = inject(InvoicesStateService);
  protected timeState = inject(TimeTrackingStateService);
  protected expensesState = inject(ExpensesStateService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  /** From route (`clientId` / `client` resolved on host) — filters case picker to this client. */
  readonly filterClientName = input<string | null>(null);

  private casesSig = toSignal(this.casesState.selectCases(), { initialValue: [] as Case[] });
  private selectedCaseSig = toSignal(this.casesState.selectSelectedCase(), {
    initialValue: null as Case | null,
  });

  readonly selectedCase$ = this.casesState.selectSelectedCase();
  readonly casesList$ = this.casesState.selectCases();
  readonly selectedClient$ = this.clientsState.selectedClient$;

  private readonly caseId$ = this.selectedCase$.pipe(
    map(c => c?.id ?? null),
    distinctUntilChanged()
  );

  readonly invoices$: Observable<Invoice[]> = this.caseId$.pipe(
    switchMap(id => (id ? this.invoicesState.selectInvoices(id) : of([])))
  );

  readonly timeEntries$ = this.caseId$.pipe(
    switchMap(id => (id ? this.timeState.selectTimeEntries(id) : of([])))
  );

  readonly expenses$ = this.caseId$.pipe(
    switchMap(id => (id ? this.expensesState.selectExpenses(id) : of([])))
  );

  readonly billable$ = this.caseId$.pipe(
    switchMap(id => (id ? this.invoicesState.selectBillableAccrued(id) : of(0)))
  );

  readonly caseExpenseTotal$ = this.caseId$.pipe(
    switchMap(id => (id ? this.casesState.selectCaseExpenseTotal(id) : of(0)))
  );

  readonly activeTimer$ = this.timeState.selectActiveTimer();

  readonly loading$ = combineLatest([
    this.invoicesState.selectLoading(),
    this.timeState.selectLoading(),
    this.expensesState.selectLoading(),
  ]).pipe(map(([a, b, c]) => a || b || c));

  readonly error$ = combineLatest([
    this.invoicesState.selectError(),
    this.timeState.selectError(),
    this.expensesState.selectError(),
  ]).pipe(map(([a, b, c]) => a || b || c || null));

  activeTab: BillingTab = 'invoices';

  invoiceNumber = '';
  invoiceAmount: number | null = null;
  invoiceIssued = '';
  invoiceDue = '';

  timeDescription = '';
  timeDuration: number | null = null;
  timeHourlyRate: number | null = null;

  timerHourlyRate: number | null = null;
  timerDescription = '';

  expenseCategory: ExpenseCategory = 'OTHER';
  expenseAmount: number | null = null;
  expenseDate = '';

  readonly invoiceStatusLabels: Record<InvoiceStatus, string> = {
    DRAFT: 'مسودة',
    SENT: 'مرسل',
    PAID: 'مدفوع',
    OVERDUE: 'متأخر',
  };

  readonly expenseCategoryLabels: Record<ExpenseCategory, string> = {
    COURT: 'محكمة',
    TRANSPORT: 'نقل',
    EXPERT: 'خبير',
    OTHER: 'أخرى',
  };

  readonly expenseCategories: ExpenseCategory[] = ['COURT', 'TRANSPORT', 'EXPERT', 'OTHER'];

  constructor() {
    effect(() => {
      const fname = this.filterClientName()?.trim() || null;
      const cases = this.casesSig();
      const selected = this.selectedCaseSig();
      if (!fname || cases.length === 0) return;
      if (selected?.clientName === fname) return;
      const first = cases.find(c => c.clientName === fname);
      if (!first || selected?.id === first.id) return;
      this.casesState.loadCase(first.id);
    });
  }

  ngOnInit(): void {
    this.casesState
      .selectCases()
      .pipe(take(1))
      .subscribe(cases => {
        if (cases.length === 0) {
          this.casesState.loadCases();
        }
      });
  }

  casesForPicker(all: Case[] | null | undefined): Case[] {
    const list = all ?? [];
    const fname = this.filterClientName()?.trim() || null;
    if (!fname) return list;
    return list.filter(c => c.clientName === fname);
  }

  onSelectCase(caseId: string): void {
    if (!caseId) {
      this.casesState.clearSelection();
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {
          [WORKSPACE_QUERY.CLIENT_ID]: null,
          [WORKSPACE_QUERY.CLIENT_NAME]: null,
        },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
      return;
    }
    const id = Number(caseId);
    if (Number.isFinite(id)) {
      this.casesState.loadCase(id);
    }
  }

  invoiceTotals(invoices: Invoice[]): { total: number; paid: number; outstanding: number } {
    const total = invoices.reduce((s, i) => s + i.amount, 0);
    const paid = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.amount, 0);
    return { total, paid, outstanding: total - paid };
  }

  createInvoice(caseId: number, clientId: number): void {
    if (
      !this.invoiceNumber.trim() ||
      this.invoiceAmount == null ||
      !this.invoiceIssued ||
      !this.invoiceDue
    ) {
      return;
    }
    this.invoicesState.createInvoice({
      caseId,
      clientId,
      number: this.invoiceNumber.trim(),
      amountHT: this.invoiceAmount,
      tvaRate: 0,
      tvaAmount: 0,
      amount: this.invoiceAmount,
      status: 'DRAFT',
      issuedAt: new Date(this.invoiceIssued),
      dueDate: new Date(this.invoiceDue),
    });
    this.invoiceNumber = '';
    this.invoiceAmount = null;
    this.invoiceIssued = '';
    this.invoiceDue = '';
  }

  sendInvoice(id: number): void {
    this.invoicesState.sendInvoice(id);
  }

  markPaid(id: number): void {
    this.invoicesState.markAsPaid(id);
  }

  removeInvoice(id: number): void {
    this.invoicesState.deleteInvoice(id);
  }

  createManualTimeEntry(caseId: number, clientId: number): void {
    if (
      !this.timeDescription.trim() ||
      this.timeDuration == null ||
      this.timeHourlyRate == null
    ) {
      return;
    }
    const duration = Math.max(1, Math.round(this.timeDuration));
    const amount =
      Math.round((duration / 60) * this.timeHourlyRate * 100) / 100;
    this.timeState.createTimeEntry(
      {
        caseId,
        description: this.timeDescription.trim(),
        duration,
        hourlyRate: this.timeHourlyRate,
        amount,
      },
      { clientId, source: 'form' }
    );
    this.timeDescription = '';
    this.timeDuration = null;
    this.timeHourlyRate = null;
  }

  startTimer(caseId: number, clientId: number): void {
    const rate = this.timerHourlyRate;
    if (rate == null || rate <= 0) return;
    this.timeState.startTimer({
      caseId,
      clientId,
      hourlyRate: rate,
      description: this.timerDescription.trim() || undefined,
    });
  }

  stopTimer(): void {
    this.timeState.stopTimer();
  }

  addExpense(caseId: number, clientId: number): void {
    if (this.expenseAmount == null || !this.expenseDate) return;
    this.expensesState.addExpense(
      {
        caseId,
        category: this.expenseCategory,
        amount: this.expenseAmount,
        date: new Date(this.expenseDate),
      },
      { clientId }
    );
    this.expenseAmount = null;
    this.expenseDate = '';
    this.expenseCategory = 'OTHER';
  }

  removeExpense(id: number): void {
    this.expensesState.deleteExpense(id);
  }

  removeTimeEntry(id: number): void {
    this.timeState.deleteTimeEntry(id);
  }
}
