import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';
import type { Deadline } from '../../../core/models';
import { idempotencyHttpOptions } from '../court-sessions-request.util';

export type CreateDeadlineDto = Omit<Deadline, 'id'>;

export type UpdateDeadlineDto = Partial<Omit<Deadline, 'id'>>;

export interface DeadlineWriteOptions {
  idempotencyKey?: string;
}

@Injectable({ providedIn: 'root' })
export class DeadlinesApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  getByCase(caseId: number): Observable<Deadline[]> {
    return this.http.get<Deadline[]>(`${this.baseUrl}${API_ENDPOINTS.DEADLINES.BY_CASE(caseId)}`);
  }

  create(dto: CreateDeadlineDto, options?: DeadlineWriteOptions): Observable<Deadline> {
    const httpOpts = options?.idempotencyKey ? idempotencyHttpOptions(options.idempotencyKey) : {};
    return this.http.post<Deadline>(`${this.baseUrl}${API_ENDPOINTS.DEADLINES.BASE}`, dto, httpOpts);
  }

  update(id: number, dto: UpdateDeadlineDto, options?: DeadlineWriteOptions): Observable<Deadline> {
    const httpOpts = options?.idempotencyKey ? idempotencyHttpOptions(options.idempotencyKey) : {};
    return this.http.put<Deadline>(`${this.baseUrl}${API_ENDPOINTS.DEADLINES.BY_ID(id)}`, dto, httpOpts);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}${API_ENDPOINTS.DEADLINES.BY_ID(id)}`);
  }
}
