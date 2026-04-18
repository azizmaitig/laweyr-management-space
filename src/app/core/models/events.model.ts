export enum AppEventType {
  // Case events
  CASE_LOADED = 'case:loaded',
  CASE_CREATED = 'case:created',
  CASE_UPDATED = 'case:updated',
  CASE_DELETED = 'case:deleted',
  CASE_SELECTED = 'case:selected',
  CASE_ERROR = 'case:error',

  // Task events
  TASKS_LOADED = 'tasks:loaded',
  TASK_CREATED = 'task:created',
  TASK_UPDATED = 'task:updated',
  TASK_COMPLETED = 'task:completed',
  TASK_DELETED = 'task:deleted',
  TASK_ERROR = 'task:error',

  // Document events
  DOCUMENTS_LOADED = 'documents:loaded',
  DOCUMENT_UPLOADED = 'document:uploaded',
  DOCUMENT_UPDATED = 'document:updated',
  DOCUMENT_DELETED = 'document:deleted',
  DOCUMENT_ERROR = 'document:error',

  // Note events
  NOTES_LOADED = 'notes:loaded',
  NOTE_ADDED = 'note:added',
  NOTE_UPDATED = 'note:updated',
  NOTE_DELETED = 'note:deleted',
  NOTE_ERROR = 'note:error',

  // Client events
  CLIENT_CREATED = 'client:created',
  CLIENT_UPDATED = 'client:updated',
  CLIENT_DELETED = 'client:deleted',
  CLIENT_ERROR = 'client:error',
  CLIENT_PORTAL_UPDATE = 'client:portal-update',
  /** Emitted when user focuses a client from the workspace (e.g. from إدارة العملاء) — optional listeners: refresh widgets, analytics. */
  CLIENT_WORKSPACE_FOCUS = 'client:workspace-focus',

  // Communication events
  COMMUNICATION_ADDED = 'communication:added',
  COMMUNICATION_DELETED = 'communication:deleted',

  // Notification events
  NOTIFICATION_CREATED = 'notification:created',
  NOTIFICATION_READ = 'notification:read',
  NOTIFICATION_DELETED = 'notification:deleted',

  // Timeline events
  TIMELINE_LOADED = 'timeline:loaded',
  TIMELINE_EVENT_ADDED = 'timeline:event-added',
  TIMELINE_EVENT_DELETED = 'timeline:event-deleted',
  TIMELINE_EVENT_UPDATED = 'timeline:event-updated',
  TIMELINE_ERROR = 'timeline:error',

  // Auth events
  AUTH_LOGIN = 'auth:login',
  AUTH_REGISTER = 'auth:register',
  AUTH_LOGOUT = 'auth:logout',
  AUTH_ERROR = 'auth:error',

  // Loading events
  LOADING_START = 'loading:start',
  LOADING_COMPLETE = 'loading:complete',

  // API events
  API_ERROR = 'api:error',

  // Financial — invoices
  INVOICES_LOADED = 'invoices:loaded',
  INVOICE_CREATED = 'invoice:created',
  INVOICE_SENT = 'invoice:sent',
  INVOICE_PAID = 'invoice:paid',
  INVOICE_UPDATED = 'invoice:updated',
  INVOICE_DELETED = 'invoice:deleted',
  INVOICE_ERROR = 'invoice:error',

  // Financial — time tracking
  TIME_ENTRIES_LOADED = 'time-entries:loaded',
  /** Preferred hook for orchestration (billable totals, invoice hints). */
  TIME_ENTRY_ADDED = 'time-entry:added',
  TIME_ENTRY_CREATED = 'time-entry:created',
  TIME_ENTRY_UPDATED = 'time-entry:updated',
  TIME_ENTRY_DELETED = 'time-entry:deleted',
  TIME_ENTRY_ERROR = 'time-entry:error',

  // Financial — expenses
  EXPENSES_LOADED = 'expenses:loaded',
  /** Preferred hook for orchestration (case financial rollups). */
  EXPENSE_ADDED = 'expense:added',
  EXPENSE_CREATED = 'expense:created',
  EXPENSE_UPDATED = 'expense:updated',
  EXPENSE_DELETED = 'expense:deleted',
  EXPENSE_ERROR = 'expense:error',

  // Court sessions & hearings
  SESSIONS_LOADED = 'sessions:loaded',
  SESSION_CREATED = 'session:created',
  SESSION_UPDATED = 'session:updated',
  SESSION_COMPLETED = 'session:completed',
  /** Fired when a session is within 48 hours (at most once per session until it passes). */
  SESSION_REMINDER = 'session:reminder',
  SESSION_OUTCOME_RECORDED = 'session:outcome-recorded',
  SESSION_DELETED = 'session:deleted',
  SESSION_ERROR = 'session:error',

  PREPARATIONS_LOADED = 'preparations:loaded',
  PREPARATION_SAVED = 'preparation:saved',
  PREPARATION_ERROR = 'preparation:error',

  OUTCOMES_LOADED = 'outcomes:loaded',
  OUTCOME_ERROR = 'outcome:error',

  DEADLINES_LOADED = 'deadlines:loaded',
  DEADLINE_CREATED = 'deadline:created',
  DEADLINE_UPDATED = 'deadline:updated',
  DEADLINE_DELETED = 'deadline:deleted',
  /** Typically when due date is within 7 days (respects `notifiedLevels`). */
  DEADLINE_APPROACHING = 'deadline:approaching',
  /** Typically when due date is within 3 days (respects `notifiedLevels`). */
  DEADLINE_WARNING = 'deadline:warning',
  /** When due date is within 24 hours (respects `notifiedLevels` / critical window). */
  DEADLINE_CRITICAL = 'deadline:critical',
  DEADLINE_ERROR = 'deadline:error',

  /** Analytics aggregates refreshed (listeners may re-read {@link AnalyticsStateService} streams). */
  ANALYTICS_UPDATED = 'analytics:updated',

  /** Request export for a case — subscribe in export/worker layer to perform PDF generation. */
  EXPORT_CASE_PDF = 'export:case-pdf',
  /** Request JSON dump for a case — subscribe in export layer. */
  EXPORT_CASE_JSON = 'export:case-json',

  // Platform — users, activity, backups, settings
  USER_CREATED = 'platform:user-created',
  USER_SELECTED = 'platform:user-selected',
  USER_UPDATED = 'platform:user-updated',
  USER_ROLE_CHANGED = 'platform:user-role-changed',
  PERMISSIONS_UPDATED = 'platform:permissions-updated',
  ACTIVITY_LOGGED = 'platform:activity-logged',
  BACKUP_STARTED = 'platform:backup-started',
  BACKUP_SUCCESS = 'platform:backup-success',
  BACKUP_FAILED = 'platform:backup-failed',
  SETTINGS_UPDATED = 'platform:settings-updated',

  // Agenda & Calendar
  AGENDA_ITEMS_LOADED = 'agenda-items:loaded',
  AGENDA_ITEM_CREATED = 'agenda-item:created',
  /** Alias for AGENDA_ITEM_CREATED — semantic naming for orchestration listeners. */
  AGENDA_ITEM_ADDED = 'agenda-item:added',
  AGENDA_ITEM_UPDATED = 'agenda-item:updated',
  AGENDA_ITEM_DELETED = 'agenda-item:deleted',
  AGENDA_ITEM_COMPLETED = 'agenda-item:completed',
  AGENDA_ITEM_MISSED = 'agenda-item:missed',
  AGENDA_ITEM_ERROR = 'agenda-item:error',

  // Reminders
  REMINDERS_LOADED = 'reminders:loaded',
  REMINDER_CREATED = 'reminder:created',
  /** Alias for REMINDER_CREATED — semantic naming for orchestration listeners. */
  REMINDER_SCHEDULED = 'reminder:scheduled',
  REMINDER_UPDATED = 'reminder:updated',
  REMINDER_DELETED = 'reminder:deleted',
  /** Fired when a reminder's reminderDate is within the trigger window. */
  REMINDER_TRIGGERED = 'reminder:triggered',
  REMINDER_SENT = 'reminder:sent',
  REMINDER_ERROR = 'reminder:error',
}

export interface AppEvent<T = unknown> {
  type: AppEventType;
  payload?: T;
  timestamp: Date;
}
