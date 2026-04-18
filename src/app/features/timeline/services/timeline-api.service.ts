import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CaseTimelineEvent } from '../../../core/models';
import { ApiService } from '../../../core/services/api.service';

export interface CreateTimelineEventDto {
  caseId: number;
  date: string;
  type: string;
  title: string;
  description: string;
  location?: string;
  amount?: number;
}

@Injectable({ providedIn: 'root' })
export class TimelineApiService extends ApiService {
  private endpoint = '/timeline';

  getByCaseId(caseId: number): Observable<CaseTimelineEvent[]> {
    return this.get<CaseTimelineEvent[]>(`${this.endpoint}/case/${caseId}`);
  }

  create(dto: CreateTimelineEventDto): Observable<CaseTimelineEvent> {
    return this.post<CaseTimelineEvent>(this.endpoint, dto);
  }

  update(id: number, dto: Partial<CreateTimelineEventDto>): Observable<CaseTimelineEvent> {
    return this.put<CaseTimelineEvent>(`${this.endpoint}/${id}`, dto);
  }

  remove(id: number): Observable<void> {
    return this.delete<void>(`${this.endpoint}/${id}`);
  }
}
