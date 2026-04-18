import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';
import type { SessionOutcome } from '../../../core/models';
import { idempotencyHttpOptions } from '../court-sessions-request.util';

export type CreateSessionOutcomeDto = Omit<SessionOutcome, 'id' | 'createdAt'>;

export type UpdateSessionOutcomeDto = Partial<Omit<SessionOutcome, 'id'>>;

export interface OutcomeWriteOptions {
  idempotencyKey?: string;
}

@Injectable({ providedIn: 'root' })
export class OutcomesApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  getByCase(caseId: number): Observable<SessionOutcome[]> {
    return this.http.get<SessionOutcome[]>(`${this.baseUrl}${API_ENDPOINTS.SESSION_OUTCOMES.BY_CASE(caseId)}`);
  }

  create(dto: CreateSessionOutcomeDto, options?: OutcomeWriteOptions): Observable<SessionOutcome> {
    const httpOpts = options?.idempotencyKey ? idempotencyHttpOptions(options.idempotencyKey) : {};
    return this.http.post<SessionOutcome>(`${this.baseUrl}${API_ENDPOINTS.SESSION_OUTCOMES.BASE}`, dto, httpOpts);
  }

  update(id: number, dto: UpdateSessionOutcomeDto, options?: OutcomeWriteOptions): Observable<SessionOutcome> {
    const httpOpts = options?.idempotencyKey ? idempotencyHttpOptions(options.idempotencyKey) : {};
    return this.http.put<SessionOutcome>(`${this.baseUrl}${API_ENDPOINTS.SESSION_OUTCOMES.BY_ID(id)}`, dto, httpOpts);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}${API_ENDPOINTS.SESSION_OUTCOMES.BY_ID(id)}`);
  }
}
