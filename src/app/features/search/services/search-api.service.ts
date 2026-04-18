import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Case, Document, Note, Task } from '../../../core/models';

export interface SearchResult {
  type: 'case' | 'document' | 'note' | 'task';
  id: number;
  title: string;
  subtitle: string;
  caseId?: number;
  icon?: string;
}

export interface SearchFilters {
  caseId?: number;
  type?: 'CASE' | 'DOCUMENT' | 'TASK' | 'NOTE';
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  dateFrom?: string;
  dateTo?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
  filters: SearchFilters;
}

@Injectable({ providedIn: 'root' })
export class SearchApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;
  private endpoint = '/search';

  /**
   * Global search across all entities
   */
  search(keyword: string, filters?: SearchFilters): Observable<SearchResponse> {
    const params: any = { q: keyword };
    if (filters?.type) params.type = filters.type;
    if (filters?.status) params.status = filters.status;
    if (filters?.priority) params.priority = filters.priority;
    if (filters?.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters?.dateTo) params.dateTo = filters.dateTo;
    if (filters?.caseId) params.caseId = filters.caseId;

    return this.http.get<SearchResponse>(this.endpoint, { params });
  }

  /**
   * Search within a specific case
   */
  searchByCase(caseId: number, keyword: string): Observable<SearchResult[]> {
    return this.http.get<SearchResult[]>(`${this.endpoint}/case/${caseId}`, {
      params: { q: keyword },
    });
  }

  /**
   * Search cases only
   */
  searchCases(keyword: string, filters?: SearchFilters): Observable<Case[]> {
    return this.http.get<Case[]>(`${this.endpoint}/cases`, {
      params: { q: keyword, ...filters },
    });
  }

  /**
   * Search documents only
   */
  searchDocuments(keyword: string, filters?: SearchFilters): Observable<Document[]> {
    return this.http.get<Document[]>(`${this.endpoint}/documents`, {
      params: { q: keyword, ...filters },
    });
  }

  /**
   * Search tasks only
   */
  searchTasks(keyword: string, filters?: SearchFilters): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.endpoint}/tasks`, {
      params: { q: keyword, ...filters },
    });
  }

  /**
   * Search notes only
   */
  searchNotes(keyword: string, filters?: SearchFilters): Observable<Note[]> {
    return this.http.get<Note[]>(`${this.endpoint}/notes`, {
      params: { q: keyword, ...filters },
    });
  }
}
