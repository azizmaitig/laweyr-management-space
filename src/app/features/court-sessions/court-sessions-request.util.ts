import { HttpHeaders } from '@angular/common/http';

/** HTTP header name — backend may use for deduplication / safe retries (document in API_COURT_SESSIONS.md). */
export const IDEMPOTENCY_KEY_HEADER = 'Idempotency-Key';

/** UUID v4 for write idempotency (falls back if `crypto.randomUUID` is unavailable). */
export function newClientRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `cr_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

export function idempotencyHttpOptions(idempotencyKey: string): { headers: HttpHeaders } {
  return { headers: new HttpHeaders({ [IDEMPOTENCY_KEY_HEADER]: idempotencyKey }) };
}
