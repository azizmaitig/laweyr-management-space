import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';
import type { SessionPreparation } from '../../../core/models';
import { idempotencyHttpOptions } from '../court-sessions-request.util';

export type CreateSessionPreparationDto = Omit<SessionPreparation, 'id'>;

export type UpdateSessionPreparationDto = Partial<Omit<SessionPreparation, 'id'>>;

export interface PreparationWriteOptions {
  idempotencyKey?: string;
}

@Injectable({ providedIn: 'root' })
export class PreparationApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  getByCase(caseId: number): Observable<SessionPreparation[]> {
    return this.http.get<SessionPreparation[]>(
      `${this.baseUrl}${API_ENDPOINTS.SESSION_PREPARATIONS.BY_CASE(caseId)}`
    );
  }

  create(dto: CreateSessionPreparationDto, options?: PreparationWriteOptions): Observable<SessionPreparation> {
    const httpOpts = options?.idempotencyKey ? idempotencyHttpOptions(options.idempotencyKey) : {};
    return this.http.post<SessionPreparation>(
      `${this.baseUrl}${API_ENDPOINTS.SESSION_PREPARATIONS.BASE}`,
      dto,
      httpOpts
    );
  }

  update(
    id: number,
    dto: UpdateSessionPreparationDto,
    options?: PreparationWriteOptions
  ): Observable<SessionPreparation> {
    const httpOpts = options?.idempotencyKey ? idempotencyHttpOptions(options.idempotencyKey) : {};
    return this.http.put<SessionPreparation>(
      `${this.baseUrl}${API_ENDPOINTS.SESSION_PREPARATIONS.BY_ID(id)}`,
      dto,
      httpOpts
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}${API_ENDPOINTS.SESSION_PREPARATIONS.BY_ID(id)}`);
  }
}
