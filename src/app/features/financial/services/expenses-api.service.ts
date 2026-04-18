import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';
import { Expense } from '../../../core/models';

export type CreateExpenseDto = Omit<Expense, 'id'>;

export type UpdateExpenseDto = Partial<Omit<Expense, 'id'>>;

@Injectable({ providedIn: 'root' })
export class ExpensesApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  getByCase(caseId: number): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${this.baseUrl}${API_ENDPOINTS.EXPENSES.BY_CASE(caseId)}`);
  }

  create(dto: CreateExpenseDto): Observable<Expense> {
    return this.http.post<Expense>(`${this.baseUrl}${API_ENDPOINTS.EXPENSES.BASE}`, dto);
  }

  update(id: number, dto: UpdateExpenseDto): Observable<Expense> {
    return this.http.put<Expense>(`${this.baseUrl}${API_ENDPOINTS.EXPENSES.BY_ID(id)}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}${API_ENDPOINTS.EXPENSES.BY_ID(id)}`);
  }
}
