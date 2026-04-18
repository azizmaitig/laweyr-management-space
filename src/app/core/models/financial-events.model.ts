/**
 * Standard financial event payload for cross-feature orchestration (via EventService).
 */
export interface FinancialEventPayload {
  caseId: number;
  clientId: number;
  amount: number;
  metadata?: Record<string, unknown>;
}
