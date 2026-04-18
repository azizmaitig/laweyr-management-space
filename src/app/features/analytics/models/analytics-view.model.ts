import type { CaseType } from '../../../core/models';

export interface CaseTypeSlice {
  type: CaseType;
  label: string;
  count: number;
  percent: number;
  color: string;
}

export interface ActivitySummaryItem {
  title: string;
  detail: string;
  date: string;
}

export interface OverduePaymentRow {
  id: string;
  caseNumber: string;
  label: string;
  amount: number;
  dueDate: string;
  caseId: number;
}

/** Office- or case-scoped KPIs (same shape; scope driven by selection in {@link AnalyticsStateService}). */
export interface GlobalAnalyticsView {
  successRate: number;
  avgCaseDuration: number;
  collectionRate: number;
  caseTypeDistribution: CaseTypeSlice[];
  recentActivity: ActivitySummaryItem[];
}

export interface FinancialAnalyticsView {
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  monthlyRevenue: { label: string; amount: number }[];
  yearlyRevenue: { label: string; amount: number }[];
  overduePayments: OverduePaymentRow[];
}

/** Highlights for the active dossier (null fields when no selection). */
export interface CaseAnalyticsView {
  caseId: number | null;
  caseNumber: string | null;
  successRate: number | null;
  avgCaseDuration: number | null;
  collectionRate: number | null;
}
