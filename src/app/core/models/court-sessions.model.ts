export type SessionStatus = 'UPCOMING' | 'COMPLETED' | 'POSTPONED';

export interface Session {
  id: number;
  caseId: number;
  date: Date;
  court: string;
  type?: string;
  status: SessionStatus;
  nextSessionDate?: Date;
}

export interface SessionPreparation {
  id: number;
  sessionId: number;
  checklist: string[];
  notes: string;
  createdAt: Date;
}

export type SessionOutcomeResult =
  | 'POSTPONED'
  | 'PARTIAL_JUDGMENT'
  | 'FINAL_JUDGMENT'
  | 'APPEAL';

export interface SessionOutcome {
  id: number;
  sessionId: number;
  result: SessionOutcomeResult;
  summary: string;
  nextSessionDate?: Date;
  createdAt: Date;
}

export type DeadlineType = 'LEGAL' | 'CUSTOM';

export type DeadlinePriority = 'LOW' | 'MEDIUM' | 'HIGH';

/** Day offsets before due date for alerts, e.g. [7, 3, 1]. */
export interface Deadline {
  id: number;
  caseId: number;
  title: string;
  dueDate: Date;
  type: DeadlineType;
  priority: DeadlinePriority;
  notifiedLevels: number[];
}
