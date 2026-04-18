/**
 * In-memory demo payloads for `hearingsDemo` HTTP interceptor (dev exploration without API).
 * Dates are ISO strings as the real API would return.
 */
import type { Case } from '../../core/models/lawyer.model';

const DEMO_CASE_ID = 101;

/** Two sample ملفات for the hearings dropdown */
export const HEARINGS_DEMO_CASES: Case[] = [
  {
    id: DEMO_CASE_ID,
    number: 'ت.م 2026/0142',
    title: 'نزاع تجاري — عقد توريد',
    clientId: 0,
    clientName: 'شركة النور للتجارة',
    status: 'active',
    type: 'commercial',
    court: 'المحكمة الابتدائية بتونس',
    fees: 4500,
    paidFees: 2000,
    hearingDate: new Date().toISOString().split('T')[0],
    progress: 45,
    stage: 2,
    totalStages: 5,
  },
  {
    id: 102,
    number: 'ت.ج 2025/0088',
    title: 'جنح — ضرب وجرح',
    clientId: 0,
    clientName: 'محمد العبدلي',
    status: 'pending',
    type: 'penal',
    court: 'محكمة الناحية بأريانة',
    fees: 2800,
    paidFees: 2800,
    hearingDate: new Date().toISOString().split('T')[0],
    progress: 70,
  },
];

const iso = (d: Date) => d.toISOString();

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(9, 0, 0, 0);

const nextWeek = new Date();
nextWeek.setDate(nextWeek.getDate() + 8);
nextWeek.setHours(10, 30, 0, 0);

/** Demo court sessions (case 101) — ids fixed for GET by id */
export const HEARINGS_DEMO_SESSIONS_RAW = [
  {
    id: 9001,
    caseId: DEMO_CASE_ID,
    date: iso(tomorrow),
    court: 'المحكمة الابتدائية بتونس — قسم تجاري',
    type: 'جلسة استماع',
    status: 'UPCOMING' as const,
  },
  {
    id: 9002,
    caseId: DEMO_CASE_ID,
    date: iso(new Date(Date.now() - 86400000 * 3)),
    court: 'المحكمة الابتدائية بتونس',
    type: 'مرافعة',
    status: 'COMPLETED' as const,
  },
  {
    id: 9003,
    caseId: DEMO_CASE_ID,
    date: iso(nextWeek),
    court: 'المحكمة الابتدائية بتونس',
    type: 'حكم',
    status: 'POSTPONED' as const,
    nextSessionDate: iso(nextWeek),
  },
];

export const HEARINGS_DEMO_PREPARATIONS_RAW = [
  {
    id: 8001,
    sessionId: 9001,
    checklist: ['مذكرة جوابية', 'شهادة الشاهد أ.ح.', 'السجل التجاري للخصم'],
    notes: 'مراجعة المواد 214–218 من مجلة الالتزامات قبل الجلسة.',
    createdAt: iso(new Date(Date.now() - 86400000 * 2)),
  },
];

export const HEARINGS_DEMO_OUTCOMES_RAW = [
  {
    id: 7001,
    sessionId: 9002,
    result: 'PARTIAL_JUDGMENT' as const,
    summary: 'قبول جزئي للطلب؛ استكمال البحث في الخبرة.',
    createdAt: iso(new Date(Date.now() - 86400000 * 2)),
  },
];

export const HEARINGS_DEMO_DEADLINES_RAW = [
  {
    id: 6001,
    caseId: DEMO_CASE_ID,
    title: 'آخر أجل لإيداع المذكرة التكميلية',
    dueDate: iso(new Date(Date.now() + 86400000 * 5)),
    type: 'LEGAL' as const,
    priority: 'HIGH' as const,
    notifiedLevels: [7, 3, 1],
  },
  {
    id: 6002,
    caseId: DEMO_CASE_ID,
    title: 'موعد تسليم تقرير الخبير',
    dueDate: iso(new Date(Date.now() + 86400000 * 14)),
    type: 'CUSTOM' as const,
    priority: 'MEDIUM' as const,
    notifiedLevels: [7, 3],
  },
];

export { DEMO_CASE_ID };
