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
import type { AgendaItem } from '../../../core/models';
import { AgendaItemEventPayload } from '../../../core/models/agenda-item.model';
import { AppEventType } from '../../../core/models/events.model';
import { EventService } from '../../../core/services/event.service';
import { newClientRequestId } from '../../court-sessions/court-sessions-request.util';
import { AgendaApiService, CreateAgendaItemDto, UpdateAgendaItemDto } from './agenda-api.service';
import { MOCK_AGENDA_ITEMS } from '../mock/agenda-mock.data';
import { environment } from '../../../../environments/environment';

export type AgendaItemWriteKind = 'create' | 'update';

export interface AgendaState {
  items: AgendaItem[];
  loading: boolean;
  error: string | null;
  /** Server id or optimistic temp id (negative) → in-flight write */
  writePending: Record<number, AgendaItemWriteKind>;
  currentCaseId: number | null;
}

const initialState: AgendaState = {
  items: [],
  loading: false,
  error: null,
  writePending: {},
  currentCaseId: null,
};

const REMINDER_POLL_MS = 5 * 60 * 1000; // Check every 5 minutes for upcoming items

function reviveAgendaItem(item: AgendaItem): AgendaItem {
  return {
    ...item,
    startDate: new Date(item.startDate),
    endDate: item.endDate ? new Date(item.endDate) : undefined,
    createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
    updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
  };
}

function omitPendingKey(
  pending: Record<number, AgendaItemWriteKind>,
  id: number
): Record<number, AgendaItemWriteKind> {
  const { [id]: _, ...rest } = pending;
  return rest;
}

@Injectable({ providedIn: 'root' })
export class AgendaStateService implements OnDestroy {
  private api = inject(AgendaApiService);
  private events = inject(EventService);
  private state = new BehaviorSubject<AgendaState>(initialState);
  state$ = this.state.asObservable();

  private subscriptions = new Subscription();
  private reminderEmittedForItemId = new Set<number>();
  private tempItemCounter = 0;

  /** Derived stream: all upcoming agenda items in the next 7 days. */
  readonly UpcomingAgendaItems$ = this.state$.pipe(
    map(s => {
      const now = Date.now();
      const NEXT_7_DAYS = 7 * 24 * 60 * 60 * 1000;
      return s.items
        .filter(
          i =>
            i.startDate.getTime() >= now &&
            i.startDate.getTime() - now <= NEXT_7_DAYS &&
            i.status !== 'COMPLETED' &&
            i.status !== 'MISSED'
        )
        .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    })
  );

  /** Derived stream: overdue/missed actionable items. */
  readonly OverdueItems$ = this.state$.pipe(
    map(s =>
      s.items
        .filter(
          i => i.startDate.getTime() < Date.now() && i.status !== 'COMPLETED' && i.status !== 'MISSED'
        )
        .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    )
  );

  /** Derived stream: grouped agenda by day (YYYY-MM-DD). */
  readonly DailyAgendaSummary$ = this.state$.pipe(
    map(s => {
      const grouped: Record<string, AgendaItem[]> = {};
      for (const item of s.items) {
        const key = item.startDate.toISOString().split('T')[0];
        grouped[key] ??= [];
        grouped[key].push(item);
      }
      for (const key of Object.keys(grouped)) {
        grouped[key] = grouped[key].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
      }
      return grouped;
    })
  );

  constructor() {
    this.setupEventListeners();
    this.subscriptions.add(
      interval(REMINDER_POLL_MS).subscribe(() => this.checkUpcomingReminders())
    );
  }

  private nextTempId(): number {
    return --this.tempItemCounter;
  }

  // ─── Event Listeners ──────────────────────────────────────────────

  private setupEventListeners(): void {
    // Load agenda items when a case is selected
    this.subscriptions.add(
      this.events.on<number>(AppEventType.CASE_SELECTED).subscribe(caseId =>
        this.loadAgenda(caseId)
      )
    );

    // Clear agenda when a case is deleted
    this.subscriptions.add(
      this.events.on<void>(AppEventType.CASE_DELETED).subscribe(() => {
        this.reminderEmittedForItemId.clear();
        this.patchState({ items: [], writePending: {}, currentCaseId: null });
      })
    );

    // Sync: when a court session is created, it may also be reflected as an agenda item
    this.subscriptions.add(
      this.events.on<Record<string, unknown>>(AppEventType.SESSION_CREATED).subscribe(payload => {
        this.createAgendaItemFromCrossFeatureEvent(payload, 'SESSION');
      })
    );

    // Sync: when a deadline is created/updated, reload agenda
    this.subscriptions.add(
      this.events.on<Record<string, unknown>>(AppEventType.DEADLINE_CREATED).subscribe(payload => {
        this.createAgendaItemFromCrossFeatureEvent(payload, 'LEGAL_DEADLINE');
      })
    );

    // Sync: when a task is created/updated, reload agenda
    this.subscriptions.add(
      this.events.on<Record<string, unknown>>(AppEventType.TASK_CREATED).subscribe(payload => {
        this.createAgendaItemFromCrossFeatureEvent(payload, 'TASK_DEADLINE');
      })
    );
  }

  private createAgendaItemFromCrossFeatureEvent(
    payload: Record<string, unknown>,
    type: AgendaItem['type']
  ): void {
    const caseId = this.pickNumber(payload, ['caseId', 'caseID']);
    const linkedEntityId = this.pickNumber(payload, ['linkedEntityId', 'sessionId', 'taskId', 'deadlineId', 'id']);
    const title = this.pickString(payload, ['title', 'name']) ?? this.defaultTitleForType(type);
    const date = this.pickDate(payload, ['startDate', 'dueDate', 'date', 'scheduledAt']);
    const description = this.pickString(payload, ['description', 'notes']);
    if (!caseId || !date) return;

    const duplicate = this.state.value.items.some(
      i =>
        i.caseId === caseId &&
        i.type === type &&
        i.linkedEntityId === linkedEntityId &&
        i.startDate.getTime() === date.getTime()
    );
    if (duplicate) return;

    this.addAgendaItem({
      caseId,
      type,
      title,
      description,
      startDate: date,
      linkedEntityId,
      status: 'UPCOMING',
      priority: this.pickPriority(payload),
    });
  }

  private pickNumber(src: Record<string, unknown>, keys: string[]): number | undefined {
    for (const key of keys) {
      const v = src[key];
      if (typeof v === 'number' && Number.isFinite(v)) return v;
      if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
    }
    return undefined;
  }

  private pickString(src: Record<string, unknown>, keys: string[]): string | undefined {
    for (const key of keys) {
      const v = src[key];
      if (typeof v === 'string' && v.trim() !== '') return v.trim();
    }
    return undefined;
  }

  private pickDate(src: Record<string, unknown>, keys: string[]): Date | undefined {
    for (const key of keys) {
      const v = src[key];
      const d = v instanceof Date ? v : (typeof v === 'string' || typeof v === 'number' ? new Date(v) : null);
      if (d && !Number.isNaN(d.getTime())) return d;
    }
    return undefined;
  }

  private pickPriority(src: Record<string, unknown>): AgendaItem['priority'] | undefined {
    const raw = src['priority'];
    if (raw === 'LOW' || raw === 'MEDIUM' || raw === 'HIGH') return raw;
    return undefined;
  }

  private defaultTitleForType(type: AgendaItem['type']): string {
    switch (type) {
      case 'SESSION':
        return 'Session';
      case 'TASK_DEADLINE':
        return 'Task deadline';
      case 'LEGAL_DEADLINE':
        return 'Legal deadline';
      default:
        return 'Agenda item';
    }
  }

  // ─── Selectors ────────────────────────────────────────────────────

  selectItems(caseId?: number): Observable<AgendaItem[]> {
    return this.state$.pipe(
      map(s => {
        let items = s.items;
        if (caseId !== undefined) items = items.filter(i => i.caseId === caseId);
        return items.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
      })
    );
  }

  selectUpcoming(caseId?: number): Observable<AgendaItem[]> {
    return this.state$.pipe(
      map(s => {
        const now = Date.now();
        let items = s.items.filter(
          i => i.startDate.getTime() >= now && i.status !== 'COMPLETED' && i.status !== 'MISSED'
        );
        if (caseId !== undefined) items = items.filter(i => i.caseId === caseId);
        return items.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
      })
    );
  }

  selectOverdue(caseId?: number): Observable<AgendaItem[]> {
    return this.state$.pipe(
      map(s => {
        const now = Date.now();
        let items = s.items.filter(
          i => i.startDate.getTime() < now && i.status !== 'COMPLETED' && i.status !== 'MISSED'
        );
        if (caseId !== undefined) items = items.filter(i => i.caseId === caseId);
        return items.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
      })
    );
  }

  selectByDateRange(start: Date, end: Date, caseId?: number): Observable<AgendaItem[]> {
    return this.state$.pipe(
      map(s => {
        let items = s.items.filter(
          i => i.startDate >= start && i.startDate <= end
        );
        if (caseId !== undefined) items = items.filter(i => i.caseId === caseId);
        return items.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
      })
    );
  }

  selectLoading(): Observable<boolean> {
    return this.state$.pipe(map(s => s.loading));
  }

  selectError(): Observable<string | null> {
    return this.state$.pipe(map(s => s.error));
  }

  selectWritePending(): Observable<Record<number, AgendaItemWriteKind>> {
    return this.state$.pipe(map(s => s.writePending));
  }

  /** Upcoming sessions within 48h — for the session summary widget. */
  selectUpcomingSessions(): Observable<AgendaItem[]> {
    return this.state$.pipe(
      map(s => {
        const now = Date.now();
        const FORTY_EIGHT_H = 48 * 60 * 60 * 1000;
        return s.items
          .filter(
            i =>
              i.type === 'SESSION' &&
              i.startDate.getTime() >= now &&
              i.startDate.getTime() - now <= FORTY_EIGHT_H &&
              i.status !== 'COMPLETED' &&
              i.status !== 'MISSED'
          )
          .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
      })
    );
  }

  /** Critical legal deadlines — LEGAL_DEADLINE items due within 3 days. */
  selectCriticalDeadlines(caseId?: number): Observable<AgendaItem[]> {
    return this.state$.pipe(
      map(s => {
        const now = Date.now();
        const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
        let items = s.items.filter(
          i =>
            i.type === 'LEGAL_DEADLINE' &&
            i.startDate.getTime() >= now &&
            i.startDate.getTime() - now <= THREE_DAYS &&
            i.status !== 'COMPLETED' &&
            i.status !== 'MISSED'
        );
        if (caseId !== undefined) items = items.filter(i => i.caseId === caseId);
        return items.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
      })
    );
  }

  // ─── Actions ──────────────────────────────────────────────────────

  /** Load upcoming items across all cases (for dashboard/overview). Uses mock data in dev. */
  loadUpcoming(limit?: number): void {
    // Dev: use mock data when no real API
    if (!environment.production || !this.api) {
      this._loadMockItems();
      return;
    }

    this.patchState({ loading: true, error: null });
    this.api
      .getUpcoming(limit)
      .pipe(
        tap(raw => {
          this.patchState({
            items: raw.map(reviveAgendaItem),
            loading: false,
          });
          this.events.emit(AppEventType.AGENDA_ITEMS_LOADED, { count: raw.length });
          this.checkUpcomingReminders();
        }),
        catchError((err: { message: string }) => {
          this.patchState({ loading: false, error: err.message });
          this.events.emit(AppEventType.AGENDA_ITEM_ERROR, err.message);
          return of([] as AgendaItem[]);
        })
      )
      .subscribe();
  }

  /** Load items for a specific case. Uses mock data in dev. */
  loadItems(caseId: number): void {
    // Dev: use mock data
    if (!environment.production) {
      this._loadMockItems(caseId);
      return;
    }

    this.patchState({ loading: true, error: null });
    this.api
      .getByCase(caseId)
      .pipe(
        tap(raw => {
          const serverItems = raw.map(reviveAgendaItem);
          const optimistic = this.state.value.items.filter(i => i.id < 0 && i.caseId === caseId);
          this.patchState({
            items: [...optimistic, ...serverItems],
            loading: false,
            currentCaseId: caseId,
          });
          this.events.emit(AppEventType.AGENDA_ITEMS_LOADED, { caseId, count: serverItems.length });
          this.checkUpcomingReminders();
        }),
        catchError((err: { message: string }) => {
          this.patchState({ loading: false, error: err.message });
          this.events.emit(AppEventType.AGENDA_ITEM_ERROR, err.message);
          return of([] as AgendaItem[]);
        })
      )
      .subscribe();
  }

  /** Load mock agenda items for development. */
  private _loadMockItems(caseId?: number): void {
    let items = MOCK_AGENDA_ITEMS.map(item => ({
      ...item,
      startDate: new Date(item.startDate),
      endDate: item.endDate ? new Date(item.endDate) : undefined,
      createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
      updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
    }));
    if (caseId !== undefined) {
      items = items.filter(i => i.caseId === caseId);
    }
    this.patchState({
      items,
      loading: false,
      error: null,
    });
    this.events.emit(AppEventType.AGENDA_ITEMS_LOADED, { caseId, count: items.length });
    this.checkUpcomingReminders();
  }

  /** Load items within a date range. */
  loadByDateRange(startDate: Date, endDate: Date, caseId?: number): void {
    this.patchState({ loading: true, error: null });
    this.api
      .getByDateRange({ startDate, endDate, caseId })
      .pipe(
        tap(raw => {
          this.patchState({
            items: raw.map(reviveAgendaItem),
            loading: false,
          });
          this.events.emit(AppEventType.AGENDA_ITEMS_LOADED, { count: raw.length });
        }),
        catchError((err: { message: string }) => {
          this.patchState({ loading: false, error: err.message });
          this.events.emit(AppEventType.AGENDA_ITEM_ERROR, err.message);
          return of([] as AgendaItem[]);
        })
      )
      .subscribe();
  }

  createItem(dto: CreateAgendaItemDto): void {
    const tempId = this.nextTempId();
    const idem = newClientRequestId();
    const optimistic: AgendaItem = {
      id: tempId,
      caseId: dto.caseId,
      type: dto.type,
      title: dto.title,
      description: dto.description,
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      status: dto.status ?? 'UPCOMING',
      linkedEntityId: dto.linkedEntityId,
      priority: dto.priority,
      location: dto.location,
    };
    const cur = this.state.value;
    this.patchState({
      error: null,
      items: [optimistic, ...cur.items],
      writePending: { ...cur.writePending, [tempId]: 'create' },
    });

    this.api
      .create(dto, { idempotencyKey: idem })
      .pipe(
        tap(raw => {
          const item = reviveAgendaItem(raw);
          const pending = omitPendingKey(this.state.value.writePending, tempId);
          this.patchState({
            items: this.state.value.items.map(i => (i.id === tempId ? item : i)),
            writePending: pending,
          });
          this.events.emit(AppEventType.AGENDA_ITEM_ADDED, this.toPayload(item));
          this.events.emit(AppEventType.AGENDA_ITEM_CREATED, this.toPayload(item));
          this.checkUpcomingReminders();
        }),
        catchError((err: { message: string }) => {
          const pending = omitPendingKey(this.state.value.writePending, tempId);
          this.patchState({
            items: this.state.value.items.filter(i => i.id !== tempId),
            writePending: pending,
            error: err.message,
          });
          this.events.emit(AppEventType.AGENDA_ITEM_ERROR, err.message);
          return of(null);
        })
      )
      .subscribe();
  }

  // Spec aliases
  loadAgenda(caseId: number): void {
    this.loadItems(caseId);
  }

  addAgendaItem(item: CreateAgendaItemDto): void {
    this.createItem(item);
  }

  updateAgendaItem(item: UpdateAgendaItemDto & { id: number }): void {
    this.updateItem(item.id, item);
  }

  deleteAgendaItem(id: number): void {
    this.deleteItem(id);
  }

  updateItem(id: number, dto: UpdateAgendaItemDto): void {
    if (id < 0) {
      const cur = this.state.value;
      const prev = cur.items.find(i => i.id === id);
      if (!prev) return;
      const merged: AgendaItem = {
        ...prev,
        ...dto,
        id,
        startDate: dto.startDate ? new Date(dto.startDate) : prev.startDate,
        endDate: dto.endDate ? new Date(dto.endDate) : prev.endDate,
      };
      this.patchState({
        items: cur.items.map(i => (i.id === id ? merged : i)),
      });
      return;
    }

    const cur = this.state.value;
    const prev = cur.items.find(i => i.id === id);
    if (!prev) return;
    const snapshot = { ...prev };
    const optimistic: AgendaItem = {
      ...prev,
      ...dto,
      id,
      startDate: dto.startDate ? new Date(dto.startDate) : prev.startDate,
      endDate: dto.endDate ? new Date(dto.endDate) : prev.endDate,
    };
    const idem = newClientRequestId();

    this.patchState({
      error: null,
      items: cur.items.map(i => (i.id === id ? optimistic : i)),
      writePending: { ...cur.writePending, [id]: 'update' },
    });

    this.api
      .update(id, dto, { idempotencyKey: idem })
      .pipe(
        tap(raw => {
          const updated = reviveAgendaItem(raw);
          const pending = omitPendingKey(this.state.value.writePending, id);
          this.patchState({
            items: this.state.value.items.map(i => (i.id === id ? updated : i)),
            writePending: pending,
          });
          if (updated.status === 'COMPLETED') {
            this.events.emit(AppEventType.AGENDA_ITEM_COMPLETED, this.toPayload(updated));
          } else {
            this.events.emit(AppEventType.AGENDA_ITEM_UPDATED, this.toPayload(updated));
          }
          this.checkUpcomingReminders();
        }),
        catchError((err: { message: string }) => {
          const pending = omitPendingKey(this.state.value.writePending, id);
          this.patchState({
            items: this.state.value.items.map(i => (i.id === id ? snapshot : i)),
            writePending: pending,
            error: err.message,
          });
          this.events.emit(AppEventType.AGENDA_ITEM_ERROR, err.message);
          return of(null);
        })
      )
      .subscribe();
  }

  deleteItem(id: number): void {
    if (id < 0) {
      const pending = omitPendingKey(this.state.value.writePending, id);
      this.patchState({
        items: this.state.value.items.filter(i => i.id !== id),
        writePending: pending,
      });
      return;
    }

    const removed = this.state.value.items.find(i => i.id === id);
    this.patchState({ error: null });
    this.api
      .delete(id)
      .pipe(
        tap(() => {
          const current = this.state.value;
          this.reminderEmittedForItemId.delete(id);
          this.patchState({ items: current.items.filter(i => i.id !== id) });
          this.events.emit(AppEventType.AGENDA_ITEM_DELETED, {
            caseId: removed?.caseId ?? 0,
            agendaItemId: id,
            date: removed?.startDate,
            type: removed?.type,
          } satisfies AgendaItemEventPayload);
        }),
        catchError((err: { message: string }) => {
          this.patchState({ error: err.message });
          this.events.emit(AppEventType.AGENDA_ITEM_ERROR, err.message);
          return of(null);
        })
      )
      .subscribe();
  }

  /** Mark an agenda item as completed. */
  completeItem(id: number): void {
    this.patchState({ error: null });
    this.api
      .markCompleted(id)
      .pipe(
        tap(raw => {
          const updated = reviveAgendaItem(raw);
          this.patchState({
            items: this.state.value.items.map(i => (i.id === id ? updated : i)),
          });
          this.events.emit(AppEventType.AGENDA_ITEM_COMPLETED, this.toPayload(updated));
        }),
        catchError((err: { message: string }) => {
          this.patchState({ error: err.message });
          this.events.emit(AppEventType.AGENDA_ITEM_ERROR, err.message);
          return of(null);
        })
      )
      .subscribe();
  }

  /** Mark an agenda item as missed. */
  missItem(id: number): void {
    this.patchState({ error: null });
    this.api
      .markMissed(id)
      .pipe(
        tap(raw => {
          const updated = reviveAgendaItem(raw);
          this.patchState({
            items: this.state.value.items.map(i => (i.id === id ? updated : i)),
          });
          this.events.emit(AppEventType.AGENDA_ITEM_MISSED, this.toPayload(updated));
        }),
        catchError((err: { message: string }) => {
          this.patchState({ error: err.message });
          this.events.emit(AppEventType.AGENDA_ITEM_ERROR, err.message);
          return of(null);
        })
      )
      .subscribe();
  }

  // ─── Reminder Checking ────────────────────────────────────────────

  /**
   * Checks for upcoming agenda items within a reminder window.
   * Emits REMINDER_TRIGGERED events for:
   *  - SESSION items within 48h (session summary)
   *  - All other items within 24h (general reminder)
   */
  private checkUpcomingReminders(): void {
    const now = Date.now();
    const items = this.state.value.items;
    const GENERAL_REMINDER_HOURS = 24;
    const SESSION_SUMMARY_HOURS = 48;

    for (const item of items) {
      if (item.id < 0) continue;
      if (item.status === 'COMPLETED' || item.status === 'MISSED') continue;

      const itemTime = item.startDate.getTime();
      if (Number.isNaN(itemTime)) continue;

      const msUntil = itemTime - now;
      const hoursUntil = msUntil / (60 * 60 * 1000);

      // Sessions: 48h advance summary
      if (
        item.type === 'SESSION' &&
        hoursUntil > 0 &&
        hoursUntil <= SESSION_SUMMARY_HOURS &&
        !this.reminderEmittedForItemId.has(item.id)
      ) {
        this.reminderEmittedForItemId.add(item.id);
        this.events.emit(AppEventType.SESSION_REMINDER, {
          caseId: item.caseId,
          sessionId: item.id,
          date: item.startDate,
          court: item.location,
          type: item.type,
        } as any);
      }

      // All items: 24h standard reminder
      if (
        hoursUntil > 0 &&
        hoursUntil <= GENERAL_REMINDER_HOURS &&
        !this.reminderEmittedForItemId.has(item.id)
      ) {
        this.reminderEmittedForItemId.add(item.id);
        this.events.emit(AppEventType.REMINDER_TRIGGERED, {
          caseId: item.caseId,
          agendaItemId: item.id,
          title: item.title,
          startDate: item.startDate,
          type: item.type,
          linkedEntityId: item.linkedEntityId,
        } satisfies AgendaItemEventPayload);
      }

      // Clear the flag once the item has passed
      if (msUntil <= 0) {
        this.reminderEmittedForItemId.delete(item.id);
      }
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────

  private toPayload(item: AgendaItem): AgendaItemEventPayload {
    return {
      caseId: item.caseId,
      agendaItemId: item.id,
      title: item.title,
      startDate: item.startDate,
      type: item.type,
      linkedEntityId: item.linkedEntityId,
    };
  }

  private patchState(partial: Partial<AgendaState>): void {
    this.state.next({ ...this.state.value, ...partial });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
