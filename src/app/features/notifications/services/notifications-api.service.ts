import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Notification } from '../../../core/models';

export interface CreateNotificationDto {
  type: Notification['type'];
  title: string;
  message: string;
  priority: Notification['priority'];
  clientId?: number;
  caseId?: number;
  documentId?: number;
  noteId?: number;
  taskId?: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationsApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;
  private endpoint = '/notifications';

  /**
   * Get all notifications for current user
   */
  getAll(): Observable<Notification[]> {
    return this.http.get<Notification[]>(this.endpoint);
  }

  /**
   * Get unread notification count
   */
  getUnreadCount(): Observable<number> {
    return this.http.get<number>(`${this.endpoint}/unread-count`);
  }

  /**
   * Get notifications by client
   */
  getByClient(clientId: number): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.endpoint}/client/${clientId}`);
  }

  /**
   * Get notifications by case
   */
  getByCase(caseId: number): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.endpoint}/case/${caseId}`);
  }

  /**
   * Mark notification as read
   */
  markAsRead(id: number): Observable<void> {
    return this.http.put<void>(`${this.endpoint}/${id}/read`, {});
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): Observable<void> {
    return this.http.put<void>(`${this.endpoint}/read-all`, {});
  }

  /**
   * Create a notification
   */
  create(dto: CreateNotificationDto): Observable<Notification> {
    return this.http.post<Notification>(this.endpoint, dto);
  }

  /**
   * Delete a notification
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }
}
