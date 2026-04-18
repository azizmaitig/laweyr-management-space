import { Case, CaseDocument, CaseTimelineEvent, Note, Task } from '../../../core/models';

export const CASES_MOCK: Case[] = [
  {
    id: 1,
    number: '2024/1523',
    title: 'Affaire شركة المدار للتجارة',
    clientId: 1,
    clientName: 'شركة المدار للتجارة',
    status: 'active',
    type: 'commercial',
    court: 'المحكمة التجارية بتونس',
    fees: 12000,
    paidFees: 7000,
    hearingDate: '2025-04-10',
    progress: 60,
    stage: 3,
    totalStages: 5,
  },
  {
    id: 2,
    number: '2024/0892',
    title: 'Affaire عائلة بن سالم',
    clientId: 2,
    clientName: 'عائلة بن سالم',
    status: 'active',
    type: 'family',
    court: 'محكمة الأسرة بصفاقس',
    fees: 8500,
    paidFees: 4500,
    hearingDate: '2025-04-07',
    progress: 50,
    stage: 2,
    totalStages: 4,
  },
  {
    id: 3,
    number: '2023/3341',
    title: 'Affaire مصطفى الرياحي',
    clientId: 3,
    clientName: 'مصطفى الرياحي',
    status: 'urgent',
    type: 'penal',
    court: 'المحكمة الجناحية بتونس',
    fees: 10000,
    paidFees: 6000,
    hearingDate: '2025-04-09',
    progress: 33,
    stage: 1,
    totalStages: 3,
  },
];

export const CASE_TIMELINE_MOCK: CaseTimelineEvent[] = [
  {
    id: 1,
    caseId: 1,
    date: '2025-03-01',
    type: 'document',
    title: 'إيداع مذكرة',
    description: 'تم إيداع مذكرة الدفاع',
  },
  {
    id: 2,
    caseId: 1,
    date: '2025-04-10',
    type: 'hearing',
    title: 'جلسة متابعة',
    description: 'جلسة متابعة الملف',
    location: 'المحكمة التجارية بتونس',
  },
];

export const CASE_DOCUMENTS_MOCK: CaseDocument[] = [
  {
    id: 1,
    caseId: 1,
    name: 'مذكرة دفاع.pdf',
    folder: 'memos',
    fileType: 'pdf',
    size: '1.2 MB',
    uploadDate: '2025-03-01',
    version: 1,
    tags: ['مذكرة'],
  },
];

export const CASE_TASKS_MOCK: Task[] = [
  {
    id: 1,
    caseId: 1,
    title: 'مراجعة الملف',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    dueDate: '2025-04-08',
    createdAt: '2025-04-01',
  },
];

export const CASE_NOTES_MOCK: Note[] = [
  {
    id: 1,
    caseId: 1,
    title: 'ملاحظة داخلية',
    content: '<p>مراجعة نقاط الدفاع قبل الجلسة.</p>',
    createdAt: '2025-04-01',
  },
];
