import { Injectable, inject, OnDestroy } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  Subscription,
  catchError,
  interval,
  map,
  of,
  tap,
} from 'rxjs';
import type { Reminder } from '../../../core/models';
import { AgendaItemEventPayload, ReminderEventPayload } from '../../../core/models/agenda-item.model';
import { AppEventType } from '../../../core/models/events.model';
import { EventService } from '../../../core/services/event.service';
import { newClientRequestId } from '../../court-sessions/court-sessions-request.util';
import {
  CreateReminderDto,
  ReminderApiService,
  UpdateReminderDto,
} from './reminder-api.service';
import { MOCK_REMINDERS } from '../mock/agenda-mock.data';
import { environment } from '../../../../environments/environment';

export type ReminderWriteKind = 'create' | 'update';

export interface ReminderState {
  reminders: Reminder[];
  loading: boolean;
  error: string | null;
  writePending: Record<number, ReminderWriteKind>;
}

const initialState: ReminderState = {
  reminders: [],
  loading: false,
  error: null,
  writePending: {},
};

const REMINDER_CHECK_POLL_MS = 24 * 60 * 60 * 1000; // Daily automation check

function reviveReminder(r: Reminder): Reminder {
  return {
    ...r,
    reminderDate: new Date(r.reminderDate),
    createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
  };
}

function omitPendingKey(
  pending: Record<number, ReminderWriteKind>,
  id: number
): Record<number, ReminderWriteKind> {
  const { [id]: _, ...rest } = pending;
  return rest;
}

@Injectable({ providedIn: 'root' })
export class ReminderStateService implements OnDestroy {
  private api = inject(ReminderApiService);
  private events = inject(EventService);
  private state = new BehaviorSubject<ReminderState>(initialState);
  state$ = this.state.asObservable();

  private subscriptions = new Subscription();
  private tempReminderCounter = 0;
  private agendaMetaById = new Map<number, AgendaItemEventPayload>();

  constructor() {
    this.setupEventListeners();
    this.subscriptions.add(
      interval(REMINDER_CHECK_POLL_MS).subscribe(() => this.checkUpcomingReminders())
    );
  }

  private nextTempId(): number {
    return --this.tempReminderCounter;
  }

  // ─── Event Listeners ──────────────────────────────────────────────

  private setupEventListeners(): void {
    // Load reminders when agenda items are loaded
    this.subscriptions.add(
      this.events.on<{ agendaItemId?: number }>(AppEventType.AGENDA_ITEMS_LOADED).subscribe(
        payload => {
          if (payload?.agendaItemId) this.loadByAgendaItem(payload.agendaItemId);
        }
      )
    );

    // Load reminders when a new agenda item is created
    this.subscriptions.add(
      this.events.on<{ agendaItemId: number }>(AppEventType.AGENDA_ITEM_CREATED).subscribe(
        payload => {
          if (payload.agendaItemId) this.loadByAgendaItem(payload.agendaItemId);
        }
      )
    );

    this.subscriptions.add(
      this.events.on<AgendaItemEventPayload>(AppEventType.AGENDA_ITEM_ADDED).subscribe(payload => {
        if (payload?.agendaItemId) this.agendaMetaById.set(payload.agendaItemId, payload);
      })
    );

    this.subscriptions.add(
      this.events.on<AgendaItemEventPayload>(AppEventType.AGENDA_ITEM_UPDATED).subscribe(payload => {
        if (payload?.agendaItemId) this.agendaMetaById.set(payload.agendaItemId, payload);
      })
    );

    this.subscriptions.add(
      this.events.on<AgendaItemEventPayload>(AppEventType.AGENDA_ITEM_DELETED).subscribe(payload => {
        if (payload?.agendaItemId) this.agendaMetaById.delete(payload.agendaItemId);
      })
    );

    // When a session reminder fires, create a default in-app reminder if none exists
    this.subscriptions.add(
      this.events.on<{ sessionId: number; caseId: number }>(AppEventType.SESSION_REMINDER).subscribe(
        () => {
          // Session reminders are handled by SessionsStateService;
          // this is a hook point for custom reminder creation.
        }
      )
    );

    // When a reminder is triggered (agenda item within window), emit notification
    this.subscriptions.add(
      this.events.on<ReminderEventPayload>(AppEventType.REMINDER_TRIGGERED).subscribe(payload => {
        this.events.emit(AppEventType.NOTIFICATION_CREATED, {
          type: 'system' as const,
          title: 'Rappel d\'agenda',
          message: `Échéance prochaine — ID: ${payload.agendaItemId}`,
          date: new Date().toISOString(),
          read: false,
          priority: 'high' as const,
          caseId: payload.caseId,
        });
      })
    );
  }

  // ─── Selectors ────────────────────────────────────────────────────

  selectReminders(agendaItemId?: number): Observable<Reminder[]> {
    return this.state$.pipe(
      map(s => {
        let reminders = s.reminders;
        if (agendaItemId !== undefined) {
          reminders = reminders.filter(r => r.agendaItemId === agendaItemId);
        }
        return reminders.sort((a, b) => a.reminderDate.getTime() - b.reminderDate.getTime());
      })
    );
  }

  selectPendingReminders(): Observable<Reminder[]> {
    return this.state$.pipe(
      map(s =>
        s.reminders
          .filter(r => !r.sent)
          .sort((a, b) => a.reminderDate.getTime() - b.reminderDate.getTime())
      )
    );
  }

  selectDueReminders(): Observable<Reminder[]> {
    return this.state$.pipe(
      map(s => {
        const now = Date.now();
        return s.reminders
          .filter(r => !r.sent && r.reminderDate.getTime() <= now)
          .sort((a, b) => a.reminderDate.getTime() - b.reminderDate.getTime());
      })
    );
  }

  selectLoading(): Observable<boolean> {
    return this.state$.pipe(map(s => s.loading));
  }

  selectError(): Observable<string | null> {
    return this.state$.pipe(map(s => s.error));
  }

  selectWritePending(): Observable<Record<number, ReminderWriteKind>> {
    return this.state$.pipe(map(s => s.writePending));
  }

  // ─── Actions ──────────────────────────────────────────────────────

  /** Load all reminders for a specific agenda item. */
  loadByAgendaItem(agendaItemId: number): void {
    this.patchState({ loading: true, error: null });
    this.api
      .getByAgendaItem(agendaItemId)
      .pipe(
        tap(raw => {
          this.patchState({
            reminders: raw.map(reviveReminder),
            loading: false,
          });
          this.events.emit(AppEventType.REMINDERS_LOADED, { agendaItemId, count: raw.length });
        }),
        catchError((err: { message: string }) => {
          this.patchState({ loading: false, error: err.message });
          this.events.emit(AppEventType.REMINDER_ERROR, err.message);
          return of([] as Reminder[]);
        })
      )
      .subscribe();
  }

  /** Load all pending reminders. Uses mock data in dev. */
  loadPending(): void {
    // Dev: use mock data
    if (!environment.production) {
      this._loadMockReminders();
      return;
    }

    this.patchState({ loading: true, error: null });
    this.api
      .getPending()
      .pipe(
        tap(raw => {
          this.patchState({
            reminders: raw.map(reviveReminder),
            loading: false,
          });
          this.events.emit(AppEventType.REMINDERS_LOADED, { count: raw.length });
          this.checkUpcomingReminders();
        }),
        catchError((err: { message: string }) => {
          this.patchState({ loading: false, error: err.message });
          this.events.emit(AppEventType.REMINDER_ERROR, err.message);
          return of([] as Reminder[]);
        })
      )
      .subscribe();
  }

  /** Load mock reminders for development. */
  private _loadMockReminders(): void {
    const reminders = MOCK_REMINDERS.map(r => ({
      ...r,
      reminderDate: new Date(r.reminderDate),
      createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
    }));
    this.patchState({
      reminders,
      loading: false,
      error: null,
    });
    this.events.emit(AppEventType.REMINDERS_LOADED, { count: reminders.length });
    this.checkUpcomingReminders();
  }

  createReminder(dto: CreateReminderDto): void {
    const tempId = this.nextTempId();
    const idem = newClientRequestId();
    const optimistic: Reminder = {
      id: tempId,
      agendaItemId: dto.agendaItemId,
      reminderDate: new Date(dto.reminderDate),
      sent: false,
      method: dto.method,
    };
    const cur = this.state.value;
    this.patchState({
      error: null,
      reminders: [optimistic, ...cur.reminders],
      writePending: { ...cur.writePending, [tempId]: 'create' },
    });

    this.api
      .create(dto, { idempotencyKey: idem })
      .pipe(
        tap(raw => {
          const reminder = reviveReminder(raw);
          const pending = omitPendingKey(this.state.value.writePending, tempId);
          this.patchState({
            reminders: this.state.value.reminders.map(r => (r.id === tempId ? reminder : r)),
            writePending: pending,
          });
          this.events.emit(AppEventType.REMINDER_SCHEDULED, this.toPayload(reminder));
          this.events.emit(AppEventType.REMINDER_CREATED, this.toPayload(reminder));
        }),
        catchError((err: { message: string }) => {
          const pending = omitPendingKey(this.state.value.writePending, tempId);
          this.patchState({
            reminders: this.state.value.reminders.filter(r => r.id !== tempId),
            writePending: pending,
            error: err.message,
          });
          this.events.emit(AppEventType.REMINDER_ERROR, err.message);
          return of(null);
        })
      )
      .subscribe();
  }

  // Spec aliases
  addReminder(reminder: CreateReminderDto): void {
    this.createReminder(reminder);
  }

  updateReminder(id: number, dto: UpdateReminderDto): void {
    if (id < 0) {
      const cur = this.state.value;
      const prev = cur.reminders.find(r => r.id === id);
      if (!prev) return;
      const merged: Reminder = {
        ...prev,
        ...dto,
        id,
        reminderDate: dto.reminderDate ? new Date(dto.reminderDate) : prev.reminderDate,
      };
      this.patchState({
        reminders: cur.reminders.map(r => (r.id === id ? merged : r)),
      });
      return;
    }

    const cur = this.state.value;
    const prev = cur.reminders.find(r => r.id === id);
    if (!prev) return;
    const snapshot = { ...prev };
    const optimistic: Reminder = {
      ...prev,
      ...dto,
      id,
      reminderDate: dto.reminderDate ? new Date(dto.reminderDate) : prev.reminderDate,
    };
    const idem = newClientRequestId();

    this.patchState({
      error: null,
      reminders: cur.reminders.map(r => (r.id === id ? optimistic : r)),
      writePending: { ...cur.writePending, [id]: 'update' },
    });

    this.api
      .update(id, dto, { idempotencyKey: idem })
      .pipe(
        tap(raw => {
          const updated = reviveReminder(raw);
          const pending = omitPendingKey(this.state.value.writePending, id);
          this.patchState({
            reminders: this.state.value.reminders.map(r => (r.id === id ? updated : r)),
            writePending: pending,
          });
          this.events.emit(AppEventType.REMINDER_UPDATED, this.toPayload(updated));
        }),
        catchError((err: { message: string }) => {
          const pending = omitPendingKey(this.state.value.writePending, id);
          this.patchState({
            reminders: this.state.value.reminders.map(r => (r.id === id ? snapshot : r)),
            writePending: pending,
            error: err.message,
          });
          this.events.emit(AppEventType.REMINDER_ERROR, err.message);
          return of(null);
        })
      )
      .subscribe();
  }

  deleteReminder(id: number): void {
    if (id < 0) {
      const pending = omitPendingKey(this.state.value.writePending, id);
      this.patchState({
        reminders: this.state.value.reminders.filter(r => r.id !== id),
        writePending: pending,
      });
      return;
    }

    const removed = this.state.value.reminders.find(r => r.id === id);
    this.patchState({ error: null });
    this.api
      .delete(id)
      .pipe(
        tap(() => {
          this.patchState({
            reminders: this.state.value.reminders.filter(r => r.id !== id),
          });
          this.events.emit(AppEventType.REMINDER_DELETED, {
            reminderId: id,
            agendaItemId: removed?.agendaItemId ?? 0,
            method: removed?.method ?? 'IN_APP',
          } satisfies ReminderEventPayload);
        }),
        catchError((err: { message: string }) => {
          this.patchState({ error: err.message });
          this.events.emit(AppEventType.REMINDER_ERROR, err.message);
          return of(null);
        })
      )
      .subscribe();
  }

  /** Mark a reminder as sent. */
  sendReminder(id: number): void {
    this.patchState({ error: null });
    this.api
      .markSent(id)
      .pipe(
        tap(raw => {
          const updated = reviveReminder(raw);
          this.patchState({
            reminders: this.state.value.reminders.map(r => (r.id === id ? updated : r)),
          });
          this.events.emit(AppEventType.REMINDER_SENT, this.toPayload(updated));
        }),
        catchError((err: { message: string }) => {
          this.patchState({ error: err.message });
          this.events.emit(AppEventType.REMINDER_ERROR, err.message);
          return of(null);
        })
      )
      .subscribe();
  }

  markAsSent(reminderId: number): void {
    this.sendReminder(reminderId);
  }

  // ─── Due Reminder Checking ────────────────────────────────────────

  /**
   * Checks for reminders whose reminderDate has passed and are not yet sent.
   * Automatically sends them and emits REMINDER_SENT events.
   */
  checkUpcomingReminders(): void {
    const now = Date.now();
    const reminders = this.state.value.reminders;

    for (const r of reminders) {
      if (r.id < 0 || r.sent) continue;

      const reminderTime = r.reminderDate.getTime();
      if (Number.isNaN(reminderTime)) continue;

      if (reminderTime <= now) {
        // Auto-send the reminder
        this.sendReminder(r.id);
      }
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────

  private toPayload(reminder: Reminder): ReminderEventPayload {
    const agendaMeta = this.agendaMetaById.get(reminder.agendaItemId);
    return {
      reminderId: reminder.id,
      agendaItemId: reminder.agendaItemId,
      method: reminder.method,
      caseId: agendaMeta?.caseId,
      title: agendaMeta?.title,
      reminderDate: reminder.reminderDate,
      startDate: agendaMeta?.startDate,
      type: agendaMeta?.type,
      linkedEntityId: agendaMeta?.linkedEntityId,
    };
  }

  private patchState(partial: Partial<ReminderState>): void {
    this.state.next({ ...this.state.value, ...partial });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
