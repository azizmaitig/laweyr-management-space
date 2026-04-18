import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Task } from '../../../core/models';

export interface CreateTaskDto {
  caseId: number;
  title: string;
  description?: string;
  priority: Task['priority'];
  dueDate?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: Task['status'];
  priority?: Task['priority'];
  dueDate?: string;
}

@Injectable({ providedIn: 'root' })
export class TasksApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;
  private endpoint = '/tasks';

  getByCase(caseId: number): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.endpoint}/case/${caseId}`);
  }

  getById(id: number): Observable<Task> {
    return this.http.get<Task>(`${this.endpoint}/${id}`);
  }

  create(dto: CreateTaskDto): Observable<Task> {
    return this.http.post<Task>(this.endpoint, dto);
  }

  update(id: number, dto: UpdateTaskDto): Observable<Task> {
    return this.http.put<Task>(`${this.endpoint}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }

  getTodayTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.endpoint}/today`);
  }
}
