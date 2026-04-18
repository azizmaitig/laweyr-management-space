import type { SessionOutcomeResult } from './court-sessions.model';

/**
 * Common payload shape for court-session and deadline orchestration events.
 * Consumers (e.g. notifications UI) should subscribe via `EventService` only.
 */
export interface CourtSessionEventPayload {
  caseId: number;
  sessionId?: number;
  date?: Date;
  result?: SessionOutcomeResult;
  /** Carried when a follow-up audience is scheduled from an outcome. */
  nextSessionDate?: Date;
  court?: string;
  type?: string;
  deadlineId?: number;
  title?: string;
  dueDate?: Date;
  /** Human-readable window, e.g. '7d', '3d', '24h'. */
  alertWindow?: '7d' | '3d' | '24h';
}
