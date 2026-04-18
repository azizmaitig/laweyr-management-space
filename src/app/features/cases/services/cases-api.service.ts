import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Case, CaseTimelineEvent, CaseDocument, Task, Note } from '../../../core/models';
import { PaginatedResponse, PageParams } from '../../../core/models/api-response.model';
import { environment } from '../../../../environments/environment';
import { CASES_MOCK, CASE_DOCUMENTS_MOCK, CASE_NOTES_MOCK, CASE_TASKS_MOCK, CASE_TIMELINE_MOCK } from './cases.mock';

export interface CreateCaseDto {
  number?: string;
  title: string;
  clientId: number;
  /** Optional display name; UI can resolve from `clientId` when available. */
  clientName?: string;
  type: Case['type'];
  court: string;
  status: Case['status'];
  fees: number;
  paidFees: number;
  hearingDate?: string;
}

export interface UpdateCaseDto extends Partial<CreateCaseDto> {}

@Injectable({ providedIn: 'root' })
export class CasesApiService extends ApiService {
  private endpoint = '/cases';
  private mockCases = [...CASES_MOCK];
  private readonly useMock = environment.casesDemo;

  getAll(): Observable<Case[]> {
    if (this.useMock) {
      return of([...this.mockCases]);
    }
    return this.get<Case[]>(this.endpoint);
  }

  getPaginated(params: PageParams): Observable<PaginatedResponse<Case>> {
    if (this.useMock) {
      const page = params.page ?? 0;
      const size = params.size ?? 20;
      const start = page * size;
      const data = this.mockCases.slice(start, start + size);
      const total = this.mockCases.length;
      const totalPages = Math.ceil(total / size) || 1;
      return of({
        data,
        total,
        page,
        size,
        totalPages,
        hasNext: page < totalPages - 1,
        hasPrev: page > 0,
      });
    }
    return this.fetchPaginated<PaginatedResponse<Case>>(this.endpoint, params);
  }

  getById(id: number): Observable<Case> {
    if (this.useMock) {
      const found = this.mockCases.find(c => c.id === id);
      return found ? of(found) : throwError(() => ({ message: 'Case not found' }));
    }
    return this.get<Case>(`${this.endpoint}/${id}`);
  }

  create(dto: CreateCaseDto): Observable<Case> {
    if (this.useMock) {
      const newCase: Case = {
        id: Math.max(0, ...this.mockCases.map(c => c.id)) + 1,
        number: dto.number,
        title: dto.title,
        clientId: dto.clientId,
        clientName: dto.clientName ?? '',
        type: dto.type,
        court: dto.court,
        status: dto.status,
        fees: dto.fees,
        paidFees: dto.paidFees,
        hearingDate: dto.hearingDate ?? '',
        progress: 0,
        stage: 0,
        totalStages: 5,
      };
      this.mockCases = [...this.mockCases, newCase];
      return of(newCase);
    }
    return this.post<Case>(this.endpoint, dto);
  }

  update(id: number, dto: UpdateCaseDto): Observable<Case> {
    if (this.useMock) {
      const current = this.mockCases.find(c => c.id === id);
      if (!current) {
        return throwError(() => ({ message: 'Case not found' }));
      }
      const updated = { ...current, ...dto };
      this.mockCases = this.mockCases.map(c => (c.id === id ? updated : c));
      return of(updated);
    }
    return this.put<Case>(`${this.endpoint}/${id}`, dto);
  }

  remove(id: number): Observable<void> {
    if (this.useMock) {
      this.mockCases = this.mockCases.filter(c => c.id !== id);
      return of(void 0);
    }
    return this.delete<void>(`${this.endpoint}/${id}`);
  }

  search(query: string, filters?: { status?: string; type?: string }): Observable<Case[]> {
    if (this.useMock) {
      const q = query.trim().toLowerCase();
      const filtered = this.mockCases.filter(c => {
        const matchesQuery =
          !q ||
          (c.number ?? '').toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.clientName.toLowerCase().includes(q);
        const matchesStatus = !filters?.status || c.status === filters.status;
        const matchesType = !filters?.type || c.type === filters.type;
        return matchesQuery && matchesStatus && matchesType;
      });
      return of(filtered);
    }
    const params: Record<string, string> = { q: query };
    if (filters?.status) params['status'] = filters.status;
    if (filters?.type) params['type'] = filters.type;
    return this.get<Case[]>(`${this.endpoint}/search`, params);
  }

  getTimeline(caseId: number): Observable<CaseTimelineEvent[]> {
    if (this.useMock) {
      return of(CASE_TIMELINE_MOCK.filter(e => e.caseId === caseId));
    }
    return this.get<CaseTimelineEvent[]>(`${this.endpoint}/${caseId}/timeline`);
  }

  getDocuments(caseId: number): Observable<CaseDocument[]> {
    if (this.useMock) {
      return of(CASE_DOCUMENTS_MOCK.filter(d => d.caseId === caseId));
    }
    return this.get<CaseDocument[]>(`${this.endpoint}/${caseId}/documents`);
  }

  getTasks(caseId: number): Observable<Task[]> {
    if (this.useMock) {
      return of(CASE_TASKS_MOCK.filter(t => t.caseId === caseId));
    }
    return this.get<Task[]>(`${this.endpoint}/${caseId}/tasks`);
  }

  getNotes(caseId: number): Observable<Note[]> {
    if (this.useMock) {
      return of(CASE_NOTES_MOCK.filter(n => n.caseId === caseId));
    }
    return this.get<Note[]>(`${this.endpoint}/${caseId}/notes`);
  }
}
