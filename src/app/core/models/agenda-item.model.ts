export type AgendaItemType = 'SESSION' | 'TASK_DEADLINE' | 'LEGAL_DEADLINE' | 'OTHER';

export type AgendaItemStatus = 'UPCOMING' | 'COMPLETED' | 'MISSED';

export type AgendaItemPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface AgendaItem {
  id: number;
  caseId: number;
  type: AgendaItemType;
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  status?: AgendaItemStatus;
  linkedEntityId?: number;
  priority?: AgendaItemPriority;
  location?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ReminderMethod = 'IN_APP' | 'EMAIL';

export interface Reminder {
  id: number;
  agendaItemId: number;
  reminderDate: Date;
  sent: boolean;
  method: ReminderMethod;
  createdAt?: Date;
}

export interface AgendaItemEventPayload {
  caseId: number;
  agendaItemId: number;
  title?: string;
  startDate?: Date;
  type?: AgendaItemType;
  linkedEntityId?: number;
  date?: Date;
}

export interface ReminderEventPayload {
  reminderId: number;
  agendaItemId: number;
  method: ReminderMethod;
  caseId?: number;
  title?: string;
  reminderDate?: Date;
  startDate?: Date;
  type?: AgendaItemType;
  linkedEntityId?: number;
}
