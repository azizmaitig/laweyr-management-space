import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';
import { TimeEntry } from '../../../core/models';

export type CreateTimeEntryDto = Omit<TimeEntry, 'id' | 'createdAt'>;

export type UpdateTimeEntryDto = Partial<Omit<TimeEntry, 'id' | 'caseId' | 'createdAt'>>;

@Injectable({ providedIn: 'root' })
export class TimeTrackingApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  getByCase(caseId: number): Observable<TimeEntry[]> {
    return this.http.get<TimeEntry[]>(`${this.baseUrl}${API_ENDPOINTS.TIME_ENTRIES.BY_CASE(caseId)}`);
  }

  create(dto: CreateTimeEntryDto): Observable<TimeEntry> {
    return this.http.post<TimeEntry>(`${this.baseUrl}${API_ENDPOINTS.TIME_ENTRIES.BASE}`, dto);
  }

  update(id: number, dto: UpdateTimeEntryDto): Observable<TimeEntry> {
    return this.http.put<TimeEntry>(`${this.baseUrl}${API_ENDPOINTS.TIME_ENTRIES.BY_ID(id)}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}${API_ENDPOINTS.TIME_ENTRIES.BY_ID(id)}`);
  }
}
