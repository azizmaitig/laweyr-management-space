import { Injectable, OnDestroy, inject } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  Subscription,
  combineLatest,
  map,
  shareReplay,
} from 'rxjs';
import type { Case, CaseType, Invoice } from '../../../core/models';
import { AppEventType } from '../../../core/models/events.model';
import { EventService } from '../../../core/services/event.service';
import { CasesStateService } from '../../cases/services/cases-state.service';
import { InvoicesStateService } from '../../financial/services/invoices-state.service';
import { TimelineStateService } from '../../timeline/services/timeline-state.service';
import type {
  CaseAnalyticsView,
  CaseTypeSlice,
  FinancialAnalyticsView,
  GlobalAnalyticsView,
} from '../models/analytics-view.model';

const CASE_TYPE_META: { type: CaseType; label: string; color: string }[] = [
  { type: 'commercial', label: 'تجاري', color: '#6366f1' },
  { type: 'family', label: 'عائلي', color: '#f59e0b' },
  { type: 'penal', label: 'جزائي', color: '#ea3f48' },
  { type: 'civil', label: 'مدني', color: '#0d9488' },
  { type: 'administrative', label: 'إداري', color: '#8b5cf6' },
];

function monthKeyFromHearing(hearingDate: string | undefined): string | null {
  const t = hearingDate?.trim() ?? '';
  if (t.length < 7) return null;
  return t.slice(0, 7);
}

function yearFromHearing(hearingDate: string | undefined): number | null {
  const t = hearingDate?.trim() ?? '';
  if (t.length < 4) return null;
  const y = Number(t.slice(0, 4));
  return Number.isFinite(y) ? y : null;
}

function formatMonthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  if (!y || !m) return key;
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString('ar-TN', { month: 'short', year: 'numeric' });
}

function buildCaseTypeDistribution(cases: Case[]): CaseTypeSlice[] {
  const n = cases.length;
  return CASE_TYPE_META.map(({ type, label, color }) => {
    const count = cases.filter(c => c.type === type).length;
    const percent = n > 0 ? Math.round((count / n) * 100) : 0;
    return { type, label, count, percent, color };
  });
}

function buildMonthlyRevenue(cases: Case[]): { label: string; amount: number }[] {
  const bucket = new Map<string, number>();
  for (const c of cases) {
    const key = monthKeyFromHearing(c.hearingDate);
    if (!key) continue;
    bucket.set(key, (bucket.get(key) ?? 0) + (c.fees ?? 0));
  }
  const sorted = [...bucket.entries()].sort(([a], [b]) => a.localeCompare(b));
  const last = sorted.slice(-12);
  return last.map(([key, amount]) => ({ label: formatMonthLabel(key), amount }));
}

function buildYearlyRevenue(cases: Case[]): { label: string; amount: number }[] {
  const y = new Date().getFullYear();
  const prev = y - 1;
  const sumYear = (year: number) =>
    cases
      .filter(c => yearFromHearing(c.hearingDate) === year)
      .reduce((s, c) => s + (c.fees ?? 0), 0);
  return [
    { label: String(prev), amount: sumYear(prev) },
    { label: String(y), amount: sumYear(y) },
  ];
}

function successRatePct(cases: Case[]): number {
  if (cases.length === 0) return 0;
  const closed = cases.filter(c => c.status === 'closed').length;
  return Math.round((closed / cases.length) * 100);
}

function avgCaseDurationDays(cases: Case[]): number {
  if (cases.length === 0) return 0;
  const sum = cases.reduce((s, c) => s + (c.status === 'closed' ? 120 : 30 + (100 - (c.progress ?? 0))), 0);
  return Math.round(sum / cases.length);
}

function collectionRatePct(cases: Case[]): number {
  const fees = cases.reduce((s, c) => s + (c.fees ?? 0), 0);
  if (fees <= 0) return 0;
  const paid = cases.reduce((s, c) => s + (c.paidFees ?? 0), 0);
  return Math.round((paid / fees) * 100);
}

function totals(cases: Case[], expenseByCase: Record<number, number>): {
  revenue: number;
  expenses: number;
  profit: number;
} {
  const revenue = cases.reduce((s, c) => s + (c.fees ?? 0), 0);
  const expenses = cases.reduce((s, c) => s + (expenseByCase[c.id] ?? 0), 0);
  return { revenue, expenses, profit: revenue - expenses };
}

function overduePayments(
  cases: Case[],
  invoices: Invoice[],
  scopeCaseId: number | null
): FinancialAnalyticsView['overduePayments'] {
  const rows: FinancialAnalyticsView['overduePayments'] = [];
  if (scopeCaseId != null) {
    for (const inv of invoices) {
      if (inv.caseId !== scopeCaseId || inv.status !== 'OVERDUE') continue;
      const due =
        inv.dueDate instanceof Date ? inv.dueDate.toISOString().slice(0, 10) : String(inv.dueDate).slice(0, 10);
      rows.push({
        id: `inv-${inv.id}`,
        caseNumber: inv.number,
        label: `فاتورة ${inv.number}`,
        amount: inv.amount,
        dueDate: due,
        caseId: inv.caseId,
      });
    }
  }
  for (const c of cases) {
    const due = (c.fees ?? 0) - (c.paidFees ?? 0);
    if (due <= 0.01) continue;
    rows.push({
      id: `bal-${c.id}`,
      caseNumber: c.number ?? `ملف ${c.id}`,
      label: 'أتعاب غير محصّاة بالكامل',
      amount: due,
      dueDate: '—',
      caseId: c.id,
    });
  }
  return rows;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsStateService implements OnDestroy {
  private readonly events = inject(EventService);
  private readonly casesState = inject(CasesStateService);
  private readonly invoicesState = inject(InvoicesStateService);
  private readonly timelineState = inject(TimelineStateService);

  private readonly refreshTick$ = new BehaviorSubject(0);
  private readonly subscriptions = new Subscription();

  /** Office-wide or filtered snapshot (selection drives scope). */
  private readonly snapshot$ = combineLatest([
    this.casesState.state$,
    this.invoicesState.state$,
    this.timelineState.state$,
    this.refreshTick$,
  ]).pipe(
    map(([caseSt, invSt, tlSt]): AnalyticsSnapshot => {
      const selected = caseSt.selectedCase;
      const scopeCaseId = selected?.id ?? null;
      const cases: Case[] = scopeCaseId != null ? caseSt.cases.filter(c => c.id === scopeCaseId) : caseSt.cases;

      const global: GlobalAnalyticsView = {
        successRate: successRatePct(cases),
        avgCaseDuration: avgCaseDurationDays(cases),
        collectionRate: collectionRatePct(cases),
        caseTypeDistribution: buildCaseTypeDistribution(cases),
        recentActivity: (() => {
          const ev = tlSt.events
            .filter(e => (scopeCaseId == null || e.caseId === scopeCaseId) && e.title)
            .slice(0, 8)
            .map(e => ({
              title: e.title,
              detail: e.description?.slice(0, 120) ?? '',
              date: e.date,
            }));
          return ev;
        })(),
      };

      const { revenue, expenses, profit } = totals(cases, caseSt.caseExpenseTotalByCaseId);
      const financial: FinancialAnalyticsView = {
        totalRevenue: revenue,
        totalExpenses: expenses,
        profit,
        monthlyRevenue: buildMonthlyRevenue(cases),
        yearlyRevenue: buildYearlyRevenue(cases),
        overduePayments: overduePayments(cases, invSt.invoices, scopeCaseId),
      };

      const caseScoped: CaseAnalyticsView =
        selected == null
          ? {
              caseId: null,
              caseNumber: null,
              successRate: null,
              avgCaseDuration: null,
              collectionRate: null,
            }
          : {
              caseId: selected.id,
              caseNumber: selected.number ?? String(selected.id),
              successRate: global.successRate,
              avgCaseDuration: global.avgCaseDuration,
              collectionRate: global.collectionRate,
            };

      return { global, financial, caseScoped, scopeCaseId };
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly globalAnalytics$: Observable<GlobalAnalyticsView> = this.snapshot$.pipe(map(s => s.global));
  readonly financialAnalytics$: Observable<FinancialAnalyticsView> = this.snapshot$.pipe(map(s => s.financial));
  readonly caseAnalytics$: Observable<CaseAnalyticsView> = this.snapshot$.pipe(map(s => s.caseScoped));

  constructor() {
    this.subscriptions.add(
      this.events.on(AppEventType.ANALYTICS_UPDATED).subscribe(() => {
        this.refreshTick$.next(this.refreshTick$.value + 1);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}

interface AnalyticsSnapshot {
  global: GlobalAnalyticsView;
  financial: FinancialAnalyticsView;
  caseScoped: CaseAnalyticsView;
  scopeCaseId: number | null;
}
