import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Note } from '../../../core/models';

export interface CreateNoteDto {
  caseId: number;
  title?: string;
  content: string;
}

export interface UpdateNoteDto {
  title?: string;
  content?: string;
}

@Injectable({ providedIn: 'root' })
export class NotesApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;
  private endpoint = '/notes';

  getByCase(caseId: number): Observable<Note[]> {
    return this.http.get<Note[]>(`${this.endpoint}/case/${caseId}`);
  }

  getById(id: number): Observable<Note> {
    return this.http.get<Note>(`${this.endpoint}/${id}`);
  }

  create(dto: CreateNoteDto): Observable<Note> {
    return this.http.post<Note>(this.endpoint, dto);
  }

  update(id: number, dto: UpdateNoteDto): Observable<Note> {
    return this.http.put<Note>(`${this.endpoint}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }

  search(caseId: number, query: string): Observable<Note[]> {
    return this.http.get<Note[]>(`${this.endpoint}/case/${caseId}/search`, {
      params: { q: query },
    });
  }
}
