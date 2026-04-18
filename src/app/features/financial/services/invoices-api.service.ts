import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';
import { Invoice } from '../../../core/models';

export type CreateInvoiceDto = Omit<Invoice, 'id'>;

export type UpdateInvoiceDto = Partial<Omit<Invoice, 'id'>>;

@Injectable({ providedIn: 'root' })
export class InvoicesApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  getByCase(caseId: number): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(`${this.baseUrl}${API_ENDPOINTS.INVOICES.BY_CASE(caseId)}`);
  }

  create(dto: CreateInvoiceDto): Observable<Invoice> {
    return this.http.post<Invoice>(`${this.baseUrl}${API_ENDPOINTS.INVOICES.BASE}`, dto);
  }

  update(id: number, dto: UpdateInvoiceDto): Observable<Invoice> {
    return this.http.put<Invoice>(`${this.baseUrl}${API_ENDPOINTS.INVOICES.BY_ID(id)}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}${API_ENDPOINTS.INVOICES.BY_ID(id)}`);
  }
}
