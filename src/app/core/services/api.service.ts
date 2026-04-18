import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, retry } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PageParams } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  protected http = inject(HttpClient);
  protected baseUrl = environment.apiUrl;

  protected get<T>(url: string, params?: Record<string, string | number | boolean>): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        httpParams = httpParams.set(key, String(value));
      });
    }
    return this.http.get<T>(`${this.baseUrl}${url}`, { params: httpParams });
  }

  protected post<T>(url: string, body: unknown, params?: Record<string, string | number | boolean>): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        httpParams = httpParams.set(key, String(value));
      });
    }
    return this.http.post<T>(`${this.baseUrl}${url}`, body, { params: httpParams });
  }

  protected put<T>(url: string, body: unknown): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${url}`, body);
  }

  protected patch<T>(url: string, body: unknown): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}${url}`, body);
  }

  protected delete<T>(url: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${url}`);
  }

  protected fetchPaginated<T>(url: string, pageParams: PageParams): Observable<T> {
    let params = new HttpParams()
      .set('page', String(pageParams.page ?? 0))
      .set('size', String(pageParams.size ?? 20));
    
    if (pageParams.sort) {
      params = params.set('sort', `${pageParams.sort},${pageParams.direction ?? 'asc'}`);
    }
    
    return this.http.get<T>(`${this.baseUrl}${url}`, { params });
  }

  protected withRetry<T>(observable: Observable<T>, attempts: number = 3): Observable<T> {
    return observable.pipe(
      retry({
        count: attempts,
        delay: (error, retryCount) => {
          if (error instanceof HttpErrorResponse && error.status >= 500) {
            return new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
          throw error;
        },
      })
    );
  }

  protected handleError(error: HttpErrorResponse): Observable<never> {
    const message = error.error?.message || error.message || 'Une erreur est survenue';
    return throwError(() => ({
      status: error.status,
      message,
      code: error.error?.code,
      details: error.error?.details,
      timestamp: error.error?.timestamp || new Date().toISOString(),
    }));
  }
}
