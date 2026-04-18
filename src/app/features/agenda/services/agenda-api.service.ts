import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';
import type { AgendaItem } from '../../../core/models';
import { idempotencyHttpOptions } from '../../court-sessions/court-sessions-request.util';

export interface CreateAgendaItemDto {
  caseId: number;
  type: AgendaItem['type'];
  title: string;
  description?: string;
  startDate: string | Date;
  endDate?: string | Date;
  status?: AgendaItem['status'];
  linkedEntityId?: number;
  priority?: AgendaItem['priority'];
  location?: string;
}

export interface UpdateAgendaItemDto extends Partial<CreateAgendaItemDto> {}

export interface AgendaItemWriteOptions {
  /** Sent as `Idempotency-Key` for safe retries / deduplication on the server. */
  idempotencyKey?: string;
}

export interface AgendaDateRangeQuery {
  startDate: string | Date;
  endDate: string | Date;
  caseId?: number;
  type?: AgendaItem['type'];
  status?: AgendaItem['status'];
}

@Injectable({ providedIn: 'root' })
export class AgendaApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  /** Fetch all agenda items for a specific case. */
  getByCase(caseId: number): Observable<AgendaItem[]> {
    return this.http.get<AgendaItem[]>(`${this.baseUrl}${API_ENDPOINTS.AGENDA_ITEMS.BY_CASE(caseId)}`);
  }

  /** Spec alias: getAgendaByCase(caseId). */
  getAgendaByCase(caseId: number): Observable<AgendaItem[]> {
    return this.getByCase(caseId);
  }

  /** Fetch a single agenda item by ID. */
  getById(id: number): Observable<AgendaItem> {
    return this.http.get<AgendaItem>(`${this.baseUrl}${API_ENDPOINTS.AGENDA_ITEMS.BY_ID(id)}`);
  }

  /** Fetch upcoming agenda items across all cases. */
  getUpcoming(limit?: number): Observable<AgendaItem[]> {
    const params = limit ? new HttpParams().set('limit', String(limit)) : undefined;
    return this.http.get<AgendaItem[]>(`${this.baseUrl}${API_ENDPOINTS.AGENDA_ITEMS.UPCOMING}`, { params });
  }

  /** Fetch agenda items within a date range. */
  getByDateRange(query: AgendaDateRangeQuery): Observable<AgendaItem[]> {
    let params = new HttpParams()
      .set('startDate', new Date(query.startDate).toISOString())
      .set('endDate', new Date(query.endDate).toISOString());
    if (query.caseId) params = params.set('caseId', String(query.caseId));
    if (query.type) params = params.set('type', query.type);
    if (query.status) params = params.set('status', query.status);
    return this.http.get<AgendaItem[]>(`${this.baseUrl}${API_ENDPOINTS.AGENDA_ITEMS.BY_DATE_RANGE}`, { params });
  }

  /** Spec alias: getAgendaByDateRange(startDate, endDate). */
  getAgendaByDateRange(startDate: Date, endDate: Date, caseId?: number): Observable<AgendaItem[]> {
    return this.getByDateRange({ startDate, endDate, caseId });
  }

  /** Create a new agenda item. */
  create(dto: CreateAgendaItemDto, options?: AgendaItemWriteOptions): Observable<AgendaItem> {
    const httpOpts = options?.idempotencyKey ? idempotencyHttpOptions(options.idempotencyKey) : {};
    return this.http.post<AgendaItem>(`${this.baseUrl}${API_ENDPOINTS.AGENDA_ITEMS.BASE}`, dto, httpOpts);
  }

  /** Spec alias: createAgendaItem(item). */
  createAgendaItem(item: CreateAgendaItemDto): Observable<AgendaItem> {
    return this.create(item);
  }

  /** Update an existing agenda item. */
  update(id: number, dto: UpdateAgendaItemDto, options?: AgendaItemWriteOptions): Observable<AgendaItem> {
    const httpOpts = options?.idempotencyKey ? idempotencyHttpOptions(options.idempotencyKey) : {};
    return this.http.put<AgendaItem>(`${this.baseUrl}${API_ENDPOINTS.AGENDA_ITEMS.BY_ID(id)}`, dto, httpOpts);
  }

  /** Spec alias: updateAgendaItem(item). */
  updateAgendaItem(item: Partial<AgendaItem> & { id: number }): Observable<AgendaItem> {
    const { id, ...dto } = item;
    return this.update(id, dto);
  }

  /** Delete an agenda item. */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}${API_ENDPOINTS.AGENDA_ITEMS.BY_ID(id)}`);
  }

  /** Spec alias: deleteAgendaItem(item). */
  deleteAgendaItem(item: number | Pick<AgendaItem, 'id'>): Observable<void> {
    const id = typeof item === 'number' ? item : item.id;
    return this.delete(id);
  }

  /** Mark an agenda item as completed. */
  markCompleted(id: number): Observable<AgendaItem> {
    return this.http.patch<AgendaItem>(
      `${this.baseUrl}${API_ENDPOINTS.AGENDA_ITEMS.BY_ID(id)}`,
      { status: 'COMPLETED' as const }
    );
  }

  /** Mark an agenda item as missed. */
  markMissed(id: number): Observable<AgendaItem> {
    return this.http.patch<AgendaItem>(
      `${this.baseUrl}${API_ENDPOINTS.AGENDA_ITEMS.BY_ID(id)}`,
      { status: 'MISSED' as const }
    );
  }
}
