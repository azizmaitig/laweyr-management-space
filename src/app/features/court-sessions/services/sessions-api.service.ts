import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';
import type { Session } from '../../../core/models';
import { idempotencyHttpOptions } from '../court-sessions-request.util';

export type CreateSessionDto = Omit<Session, 'id'>;

export type UpdateSessionDto = Partial<Omit<Session, 'id'>>;

export interface CourtSessionWriteOptions {
  /** Sent as `Idempotency-Key` for safe retries / deduplication on the server. */
  idempotencyKey?: string;
}

@Injectable({ providedIn: 'root' })
export class SessionsApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  getByCase(caseId: number): Observable<Session[]> {
    return this.http.get<Session[]>(`${this.baseUrl}${API_ENDPOINTS.COURT_SESSIONS.BY_CASE(caseId)}`);
  }

  getById(id: number): Observable<Session> {
    return this.http.get<Session>(`${this.baseUrl}${API_ENDPOINTS.COURT_SESSIONS.BY_ID(id)}`);
  }

  create(dto: CreateSessionDto, options?: CourtSessionWriteOptions): Observable<Session> {
    const httpOpts = options?.idempotencyKey ? idempotencyHttpOptions(options.idempotencyKey) : {};
    return this.http.post<Session>(`${this.baseUrl}${API_ENDPOINTS.COURT_SESSIONS.BASE}`, dto, httpOpts);
  }

  update(id: number, dto: UpdateSessionDto, options?: CourtSessionWriteOptions): Observable<Session> {
    const httpOpts = options?.idempotencyKey ? idempotencyHttpOptions(options.idempotencyKey) : {};
    return this.http.put<Session>(`${this.baseUrl}${API_ENDPOINTS.COURT_SESSIONS.BY_ID(id)}`, dto, httpOpts);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}${API_ENDPOINTS.COURT_SESSIONS.BY_ID(id)}`);
  }
}
