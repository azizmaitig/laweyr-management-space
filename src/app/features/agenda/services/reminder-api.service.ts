import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';
import type { Reminder } from '../../../core/models';
import { idempotencyHttpOptions } from '../../court-sessions/court-sessions-request.util';

export interface CreateReminderDto {
  agendaItemId: number;
  reminderDate: string | Date;
  method: Reminder['method'];
}

export interface UpdateReminderDto extends Partial<CreateReminderDto> {}

export interface ReminderWriteOptions {
  /** Sent as `Idempotency-Key` for safe retries / deduplication on the server. */
  idempotencyKey?: string;
}

@Injectable({ providedIn: 'root' })
export class ReminderApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  /** Fetch all reminders for a specific agenda item. */
  getByAgendaItem(agendaItemId: number): Observable<Reminder[]> {
    return this.http.get<Reminder[]>(
      `${this.baseUrl}${API_ENDPOINTS.REMINDERS.BY_AGENDA_ITEM(agendaItemId)}`
    );
  }

  /** Fetch a single reminder by ID. */
  getById(id: number): Observable<Reminder> {
    return this.http.get<Reminder>(`${this.baseUrl}${API_ENDPOINTS.REMINDERS.BY_ID(id)}`);
  }

  /** Fetch all pending (unsent) reminders. */
  getPending(): Observable<Reminder[]> {
    return this.http.get<Reminder[]>(`${this.baseUrl}${API_ENDPOINTS.REMINDERS.PENDING}`);
  }

  /** Create a new reminder. */
  create(dto: CreateReminderDto, options?: ReminderWriteOptions): Observable<Reminder> {
    const httpOpts = options?.idempotencyKey ? idempotencyHttpOptions(options.idempotencyKey) : {};
    return this.http.post<Reminder>(`${this.baseUrl}${API_ENDPOINTS.REMINDERS.BASE}`, dto, httpOpts);
  }

  /** Spec alias: scheduleReminder(reminder). */
  scheduleReminder(reminder: CreateReminderDto): Observable<Reminder> {
    return this.create(reminder);
  }

  /** Update an existing reminder. */
  update(id: number, dto: UpdateReminderDto, options?: ReminderWriteOptions): Observable<Reminder> {
    const httpOpts = options?.idempotencyKey ? idempotencyHttpOptions(options.idempotencyKey) : {};
    return this.http.put<Reminder>(
      `${this.baseUrl}${API_ENDPOINTS.REMINDERS.BY_ID(id)}`,
      dto,
      httpOpts
    );
  }

  /** Delete a reminder. */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}${API_ENDPOINTS.REMINDERS.BY_ID(id)}`);
  }

  /** Mark a reminder as sent. */
  markSent(id: number): Observable<Reminder> {
    return this.http.patch<Reminder>(
      `${this.baseUrl}${API_ENDPOINTS.REMINDERS.MARK_SENT(id)}`,
      { sent: true }
    );
  }

  /** Spec alias: markReminderSent(reminderId). */
  markReminderSent(reminderId: number): Observable<Reminder> {
    return this.markSent(reminderId);
  }
}
