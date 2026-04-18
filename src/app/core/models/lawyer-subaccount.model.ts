/**
 * Sub-accounts the cabinet lawyer creates under their workspace
 * (assistants → assistant portal, linked clients, coworkers with scoped access).
 */
export type SubAccountKind = 'LAWYER' | 'SECRETARY' | 'CLIENT' | 'PARTNER';

/** PENDING until invitee opens link and logs in; then ACTIVE. */
export type SubAccountStatus = 'PENDING' | 'ACTIVE';

export type SubAccountAccess =
  | 'cases:read'
  | 'cases:write'
  | 'documents:read'
  | 'documents:write'
  | 'hearings:read'
  | 'hearings:write'
  | 'finance:read'
  | 'finance:write'
  | 'clients:read'
  | 'clients:write'
  | 'settings:subaccounts';

export interface LawyerSubAccount {
  id: number;
  name: string;
  email: string;
  phone?: string;
  kind: SubAccountKind;
  access: SubAccountAccess[];
  /** Case targeting for this sub-account. */
  caseScope?: 'ALL' | 'SELECTED';
  /** Only used when `caseScope === 'SELECTED'`. */
  allowedCaseIds?: number[];
  createdAt: string;
  active: boolean;
  status: SubAccountStatus;
  /** Present while status is PENDING — used to build `/login?invite=` URL. */
  inviteToken?: string;
}

export const SUB_ACCOUNT_KIND_LABELS: Record<SubAccountKind, string> = {
  LAWYER: 'محامي',
  SECRETARY: 'كاتب',
  CLIENT: 'حريف',
  PARTNER: 'شريك / خبير',
};

export const SUB_ACCOUNT_STATUS_LABELS: Record<SubAccountStatus, string> = {
  PENDING: 'بانتظار أول دخول',
  ACTIVE: 'مفعّل',
};

export const SUB_ACCOUNT_ACCESS_LABELS: Record<SubAccountAccess, string> = {
  'cases:read': 'عرض القضايا',
  'cases:write': 'تعديل القضايا',
  'documents:read': 'عرض الوثائق',
  'documents:write': 'رفع/تعديل الوثائق',
  'hearings:read': 'عرض الجلسات',
  'hearings:write': 'إدارة الجلسات',
  'finance:read': 'عرض المالية',
  'finance:write': 'تعديل المالية',
  'clients:read': 'عرض العملاء',
  'clients:write': 'إدارة العملاء',
  'settings:subaccounts': 'إدارة الحسابات الفرعية',
};

/** Suggested defaults when creating a new sub-account by kind. */
export const DEFAULT_ACCESS_BY_KIND: Record<SubAccountKind, SubAccountAccess[]> = {
  LAWYER: [
    'cases:read',
    'cases:write',
    'documents:read',
    'documents:write',
    'hearings:read',
    'hearings:write',
    'finance:read',
    'clients:read',
    'clients:write',
  ],
  SECRETARY: [
    'cases:read',
    'documents:read',
    'documents:write',
    'hearings:read',
    'clients:read',
  ],
  CLIENT: ['cases:read', 'documents:read', 'hearings:read'],
  PARTNER: [
    'cases:read',
    'documents:read',
    'hearings:read',
    'finance:read',
    'clients:read',
  ],
};

export const ALL_ACCESS_OPTIONS: SubAccountAccess[] = [
  'cases:read',
  'cases:write',
  'documents:read',
  'documents:write',
  'hearings:read',
  'hearings:write',
  'finance:read',
  'finance:write',
  'clients:read',
  'clients:write',
  'settings:subaccounts',
];

/** UI grouping — lawyer adjusts permissions by domain. */
export const SUB_ACCOUNT_ACCESS_GROUPS: { title: string; keys: SubAccountAccess[] }[] = [
  { title: 'القضايا والملفات', keys: ['cases:read', 'cases:write'] },
  { title: 'الوثائق', keys: ['documents:read', 'documents:write'] },
  { title: 'الجلسات والمواعيد', keys: ['hearings:read', 'hearings:write'] },
  { title: 'المالية والفوترة', keys: ['finance:read', 'finance:write'] },
  { title: 'العملاء والتواصل', keys: ['clients:read', 'clients:write'] },
  { title: 'إعدادات المكتب', keys: ['settings:subaccounts'] },
];

/** When granting `*:write`, the paired `*:read` should be implied (enforced in UI). */
export const WRITE_IMPLIES_READ: Partial<Record<SubAccountAccess, SubAccountAccess>> = {
  'cases:write': 'cases:read',
  'documents:write': 'documents:read',
  'hearings:write': 'hearings:read',
  'finance:write': 'finance:read',
  'clients:write': 'clients:read',
};

const READ_TO_WRITE: Partial<Record<SubAccountAccess, SubAccountAccess>> = Object.fromEntries(
  Object.entries(WRITE_IMPLIES_READ).map(([w, r]) => [r, w as SubAccountAccess])
) as Partial<Record<SubAccountAccess, SubAccountAccess>>;

/** Apply write→read coupling and strip write if read removed. */
export function normalizeSubAccountAccess(selected: SubAccountAccess[]): SubAccountAccess[] {
  const set = new Set(selected);
  for (const [writeKey, readKey] of Object.entries(WRITE_IMPLIES_READ) as [SubAccountAccess, SubAccountAccess][]) {
    if (set.has(writeKey)) set.add(readKey);
  }
  for (const [readKey, writeKey] of Object.entries(READ_TO_WRITE) as [SubAccountAccess, SubAccountAccess][]) {
    if (!set.has(readKey)) set.delete(writeKey);
  }
  return ALL_ACCESS_OPTIONS.filter(k => set.has(k));
}

export const READ_ONLY_ACCESS_PRESET: SubAccountAccess[] = [
  'cases:read',
  'documents:read',
  'hearings:read',
  'finance:read',
  'clients:read',
];
