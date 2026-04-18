import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEventType, HttpProgressEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Document } from '../../../core/models';

export interface UploadResponse {
  document: Document;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class DocumentsApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  /**
   * Get all documents for a specific case
   */
  getByCase(caseId: number): Observable<Document[]> {
    return this.http.get<Document[]>(`${this.baseUrl}/documents/case/${caseId}`);
  }

  /**
   * Get a single document by ID
   */
  getById(id: number): Observable<Document> {
    return this.http.get<Document>(`${this.baseUrl}/documents/${id}`);
  }

  /**
   * Upload a file for a case
   * Returns Observable with upload progress events
   */
  upload(file: File, caseId: number, type: string): Observable<{ progress: number } | Document> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('caseId', String(caseId));
    formData.append('type', type);
    formData.append('name', file.name);

    return this.http
      .post<UploadResponse>(`${this.baseUrl}/documents/upload`, formData, {
        reportProgress: true,
        observe: 'events',
      })
      .pipe(
        map(event => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            return { progress: Math.round((100 * event.loaded) / event.total) };
          }
          if (event.type === HttpEventType.Response) {
            return event.body?.document ?? ({} as Document);
          }
          throw new Error('Unexpected event type');
        }),
        filter(event => event !== null && (event as any).progress !== undefined || (event as Document).id !== undefined)
      );
  }

  /**
   * Delete a document
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/documents/${id}`);
  }

  /**
   * Update document metadata
   */
  update(id: number, dto: { name?: string; type?: string }): Observable<Document> {
    return this.http.put<Document>(`${this.baseUrl}/documents/${id}`, dto);
  }

  /**
   * Search documents within a case
   */
  search(caseId: number, query: string): Observable<Document[]> {
    return this.http.get<Document[]>(`${this.baseUrl}/documents/case/${caseId}/search`, {
      params: { q: query },
    });
  }

  /**
   * Download a document file
   */
  download(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/documents/${id}/download`, {
      responseType: 'blob',
    });
  }
}
