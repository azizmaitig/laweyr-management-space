/**
 * API Endpoint Constants
 * Single source of truth for all backend endpoints.
 * When backend changes, update this file only.
 */
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
  },
  CASES: {
    BASE: '/cases',
    SEARCH: '/cases/search',
    PAGINATED: '/cases/paginated',
    BY_ID: (id: number) => `/cases/${id}`,
    TIMELINE: (id: number) => `/cases/${id}/timeline`,
    DOCUMENTS: (id: number) => `/cases/${id}/documents`,
    TASKS: (id: number) => `/cases/${id}/tasks`,
    NOTES: (id: number) => `/cases/${id}/notes`,
    /** Wire {@link CaseExportEventBridgeService} when the backend supports binary/JSON export. */
    EXPORT_PDF: (id: number) => `/cases/${id}/export/pdf`,
    EXPORT_JSON: (id: number) => `/cases/${id}/export/json`,
  },
  TIMELINE: {
    BASE: '/timeline',
    BY_CASE: (caseId: number) => `/timeline/case/${caseId}`,
    BY_ID: (id: number) => `/timeline/${id}`,
  },
  DOCUMENTS: {
    BASE: '/documents',
    BY_CASE: (caseId: number) => `/documents/case/${caseId}`,
    SEARCH: (caseId: number) => `/documents/case/${caseId}/search`,
    BY_ID: (id: number) => `/documents/${id}`,
    UPLOAD: '/documents/upload',
  },
  TASKS: {
    BASE: '/tasks',
    BY_CASE: (caseId: number) => `/tasks/case/${caseId}`,
    TODAY: '/tasks/today',
    BY_ID: (id: number) => `/tasks/${id}`,
  },
  NOTES: {
    BASE: '/notes',
    BY_CASE: (caseId: number) => `/notes/case/${caseId}`,
    SEARCH: (caseId: number) => `/notes/case/${caseId}/search`,
    BY_ID: (id: number) => `/notes/${id}`,
  },
  CLIENTS: {
    BASE: '/clients',
    SEARCH: '/clients/search',
    BY_ID: (id: number) => `/clients/${id}`,
    CASES: (id: number) => `/clients/${id}/cases`,
  },
  LAWYERS: {
    BASE: '/lawyers',
    SEARCH: '/lawyers/search',
    BY_ID: (id: number) => `/lawyers/${id}`,
  },
  /** Sub-accounts (assistants / linked clients / coworkers) for the authenticated lawyer */
  LAWYER_ME_SUB_ACCOUNTS: {
    BASE: '/lawyers/me/sub-accounts',
    BY_ID: (id: number) => `/lawyers/me/sub-accounts/${id}`,
    SEND_INVITE: (id: number) => `/lawyers/me/sub-accounts/${id}/send-invite`,
  },
  INVITES: {
    ACCEPT: '/invites/accept',
  },
  NOTIFICATIONS: {
    BASE: '/notifications',
    MARK_READ: (id: number) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
    UNREAD_COUNT: '/notifications/unread-count',
  },
  FEES: {
    BASE: '/fees',
    BY_CASE: (caseId: number) => `/fees/case/${caseId}`,
    SUMMARY: '/fees/summary',
  },
  HEARINGS: {
    BASE: '/hearings',
    UPCOMING: '/hearings/upcoming',
    BY_CASE: (caseId: number) => `/hearings/case/${caseId}`,
  },
  /**
   * Court sessions (audiences) — distinct from legacy HEARINGS routes if backend splits them.
   * @see docs/API_COURT_SESSIONS.md and docs/openapi/court-sessions.openapi.yaml
   */
  COURT_SESSIONS: {
    BASE: '/court-sessions',
    BY_CASE: (caseId: number) => `/court-sessions/case/${caseId}`,
    BY_ID: (id: number) => `/court-sessions/${id}`,
  },
  SESSION_PREPARATIONS: {
    BASE: '/session-preparations',
    BY_CASE: (caseId: number) => `/session-preparations/case/${caseId}`,
    BY_ID: (id: number) => `/session-preparations/${id}`,
  },
  SESSION_OUTCOMES: {
    BASE: '/session-outcomes',
    BY_CASE: (caseId: number) => `/session-outcomes/case/${caseId}`,
    BY_ID: (id: number) => `/session-outcomes/${id}`,
  },
  DEADLINES: {
    BASE: '/deadlines',
    BY_CASE: (caseId: number) => `/deadlines/case/${caseId}`,
    BY_ID: (id: number) => `/deadlines/${id}`,
  },
  STATS: {
    OVERVIEW: '/stats/overview',
    CASES_BY_TYPE: '/stats/cases-by-type',
    CASES_BY_STATUS: '/stats/cases-by-status',
    REVENUE: '/stats/revenue',
  },
  INVOICES: {
    BASE: '/invoices',
    BY_CASE: (caseId: number) => `/invoices/case/${caseId}`,
    BY_ID: (id: number) => `/invoices/${id}`,
  },
  TIME_ENTRIES: {
    BASE: '/time-entries',
    BY_CASE: (caseId: number) => `/time-entries/case/${caseId}`,
    BY_ID: (id: number) => `/time-entries/${id}`,
  },
  EXPENSES: {
    BASE: '/expenses',
    BY_CASE: (caseId: number) => `/expenses/case/${caseId}`,
    BY_ID: (id: number) => `/expenses/${id}`,
  },
  PLATFORM_USERS: {
    BASE: '/platform/users',
    BY_ID: (id: number) => `/platform/users/${id}`,
  },
  PLATFORM_ACTIVITY: {
    BASE: '/platform/activity-logs',
  },
  PLATFORM_BACKUPS: {
    BASE: '/platform/backups',
    TRIGGER: '/platform/backups/trigger',
    RESTORE: (id: number) => `/platform/backups/${id}/restore`,
  },
  PLATFORM_SETTINGS: {
    BY_USER: (userId: number) => `/platform/users/${userId}/settings`,
  },
  /** Unified agenda items (sessions, deadlines, tasks, custom events). */
  AGENDA_ITEMS: {
    BASE: '/agenda-items',
    BY_CASE: (caseId: number) => `/agenda-items/case/${caseId}`,
    BY_ID: (id: number) => `/agenda-items/${id}`,
    UPCOMING: '/agenda-items/upcoming',
    BY_DATE_RANGE: '/agenda-items/range',
  },
  /** Reminder notifications for agenda items. */
  REMINDERS: {
    BASE: '/reminders',
    BY_AGENDA_ITEM: (agendaItemId: number) => `/reminders/agenda-item/${agendaItemId}`,
    BY_ID: (id: number) => `/reminders/${id}`,
    PENDING: '/reminders/pending',
    MARK_SENT: (id: number) => `/reminders/${id}/sent`,
  },
} as const;

export type ApiEndpoints = typeof API_ENDPOINTS;
