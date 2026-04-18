import { Component, inject, computed, signal, OnInit, OnDestroy, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatListModule } from '@angular/material/list';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Observable, combineLatest, BehaviorSubject } from 'rxjs';
import { map, startWith, switchMap, distinctUntilChanged } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { AgendaStateService } from '../../services/agenda-state.service';
import { ReminderStateService } from '../../services/reminder-state.service';
import type { AgendaItem, AgendaItemType } from '../../../../core/models/agenda-item.model';
import { TranslationService } from '../../../../core/services/translation.service';
import { EventService } from '../../../../core/services/event.service';
import { AppEventType } from '../../../../core/models/events.model';
import { CalendarViewComponent } from '../calendar-view/calendar-view.component';
import { FilterPanelComponent } from '../filter-panel/filter-panel.component';
import { ReminderListComponent } from '../reminder-list/reminder-list.component';
import { AgendaItemCardComponent } from '../agenda-item-card/agenda-item-card.component';

// ─── Helpers ────────────────────────────────────────────────────────────

function isTodayFn(date: Date): boolean {
  const now = new Date();
  return date.getFullYear() === now.getFullYear() &&
         date.getMonth() === now.getMonth() &&
         date.getDate() === now.getDate();
}

function isThisWeekFn(date: Date): boolean {
  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);
  return date >= now && date <= weekEnd;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

function typeIcon(type: AgendaItemType): string {
  switch (type) {
    case 'SESSION': return 'gavel';
    case 'TASK_DEADLINE': return 'assignment';
    case 'LEGAL_DEADLINE': return 'balance';
    case 'OTHER': return 'event';
  }
}

function typeColor(type: AgendaItemType): string {
  switch (type) {
    case 'SESSION': return '#ea3f48';
    case 'TASK_DEADLINE': return '#14b8a6';
    case 'LEGAL_DEADLINE': return '#f59e0b';
    case 'OTHER': return '#6366f1';
  }
}

function priorityLabel(priority?: AgendaItem['priority']): string {
  switch (priority) {
    case 'HIGH': return '🔴';
    case 'MEDIUM': return '🟡';
    default: return '';
  }
}

function isCriticalFn(item: AgendaItem): boolean {
  const now = Date.now();
  const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
  return item.type === 'LEGAL_DEADLINE' &&
         item.startDate.getTime() >= now &&
         item.startDate.getTime() - now <= THREE_DAYS &&
         item.status !== 'COMPLETED' &&
         item.status !== 'MISSED';
}

function isOverdueFn(item: AgendaItem): boolean {
  return item.startDate.getTime() < Date.now() &&
         item.status !== 'COMPLETED' &&
         item.status !== 'MISSED';
}

// ─── Calendar Grid Helpers ──────────────────────────────────────────────

interface CalendarSlot {
  date: Date;
  dayNum: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  items: AgendaItem[];
}

interface WeekSlot {
  date: Date;
  dayName: string;
  dayNum: number;
  isToday: boolean;
  items: AgendaItem[];
}

function buildMonthGrid(year: number, month: number, items: AgendaItem[]): CalendarSlot[][] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const weeks: CalendarSlot[][] = [];
  let current = new Date(firstDay);
  current.setDate(current.getDate() - startOffset);

  for (let w = 0; w < 6; w++) {
    const week: CalendarSlot[] = [];
    for (let d = 0; d < 7; d++) {
      const dayItems = items.filter(i =>
        i.startDate.getFullYear() === current.getFullYear() &&
        i.startDate.getMonth() === current.getMonth() &&
        i.startDate.getDate() === current.getDate()
      ).sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
      week.push({
        date: new Date(current),
        dayNum: current.getDate(),
        isCurrentMonth: current.getMonth() === month,
        isToday: isTodayFn(current),
        items: dayItems,
      });
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
    if (current > lastDay && w >= 4) break;
  }
  return weeks;
}

function buildWeekGrid(now: Date, items: AgendaItem[]): WeekSlot[] {
  const days: WeekSlot[] = [];
  const start = new Date(now);
  start.setDate(start.getDate() - start.getDay());

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dayItems = items.filter(item =>
      item.startDate.getFullYear() === d.getFullYear() &&
      item.startDate.getMonth() === d.getMonth() &&
      item.startDate.getDate() === d.getDate()
    ).sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    days.push({
      date: d,
      dayName: d.toLocaleDateString('fr-FR', { weekday: 'short' }),
      dayNum: d.getDate(),
      isToday: isTodayFn(d),
      items: dayItems,
    });
  }
  return days;
}

// ─── Interfaces for reminder typing ─────────────────────────────────────

interface ReminderInfo {
  id: number;
  agendaItemId: number;
  reminderDate: Date;
  sent: boolean;
  method: 'IN_APP' | 'EMAIL';
}

// ─── Component ──────────────────────────────────────────────────────────

@Component({
  selector: 'app-agenda-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatListModule,
    MatButtonToggleModule,
    MatSnackBarModule,
    CalendarViewComponent,
    FilterPanelComponent,
    ReminderListComponent,
    AgendaItemCardComponent,
  ],
  templateUrl: './agenda-dashboard.component.html',
  styleUrls: ['./agenda-dashboard.component.scss'],
})
export class AgendaDashboardComponent implements OnInit, OnDestroy {
  protected agendaState = inject(AgendaStateService);
  protected reminderState = inject(ReminderStateService);
  protected translation = inject(TranslationService);
  protected events = inject(EventService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  private subscriptions = new Subscription();

  // Filter & nav state as BehaviorSubject for full RxJS reactivity
  private filterSubject = new BehaviorSubject<Set<AgendaItemType>>(new Set());
  readonly activeFilters$ = this.filterSubject.asObservable();

  private navDateSubject = new BehaviorSubject<Date>(new Date());

  // ─── Filter & nav as observables ──────────────────────────────────
  @Input()
  set caseId(val: number | null) {
    this._caseId = val;
    if (val != null) this.agendaState.loadItems(val);
  }

  private _caseId: number | null = null;

  // ─── Output events → child → parent / state services ──────────────
  @Output() itemUpdated = new EventEmitter<{ id: number; changes: Partial<AgendaItem> }>();
  @Output() itemCompleted = new EventEmitter<number>();
  @Output() itemDeleted = new EventEmitter<number>();
  @Output() reminderSnoozed = new EventEmitter<number>();
  @Output() reminderDismissed = new EventEmitter<number>();

  // ─── Observable streams (async pipe) ──────────────────────────────
  readonly agendaItems$ = this.agendaState.state$.pipe(
    map(s => s.items as AgendaItem[])
  );

  readonly reminders$ = this.reminderState.state$.pipe(
    map(s => s.reminders as ReminderInfo[])
  );

  readonly upcomingSessions$ = this.agendaState.selectUpcomingSessions();
  readonly criticalDeadlines$ = this.agendaState.selectCriticalDeadlines();
  readonly pendingReminders$ = this.reminderState.selectPendingReminders().pipe(
    map(reminders => reminders as ReminderInfo[])
  );

  readonly agendaLoading$ = this.agendaState.selectLoading();
  readonly reminderLoading$ = this.reminderState.selectLoading();

  // ─── Derived observables (reactive to filters) ────────────────────

  /** All active items filtered by type. */
  readonly activeItems$: Observable<AgendaItem[]> = this.agendaItems$.pipe(
    switchMap(items =>
      this.activeFilters$.pipe(
        map(filters => {
          let filtered = items.filter(i => i.status !== 'COMPLETED' && i.status !== 'MISSED');
          if (filters.size > 0) {
            filtered = filtered.filter(i => filters.has(i.type));
          }
          return filtered.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
        })
      )
    )
  );

  readonly overdueItems$: Observable<AgendaItem[]> = this.agendaItems$.pipe(
    map(items => items.filter(isOverdueFn))
  );

  readonly todayItems$: Observable<AgendaItem[]> = this.activeItems$.pipe(
    map(items => items.filter((i: AgendaItem) => isTodayFn(i.startDate)))
  );

  readonly weekItems$: Observable<AgendaItem[]> = this.activeItems$.pipe(
    map(items => items.filter((i: AgendaItem) => isThisWeekFn(i.startDate)))
  );

  readonly activeCount$ = this.activeItems$.pipe(
    map(items => items.length)
  );

  /** Stats summary stream */
  readonly statsSummary$ = this.agendaItems$.pipe(
    map(items => {
      const active = items.filter(i => i.status !== 'COMPLETED' && i.status !== 'MISSED');
      return {
        sessions: active.filter(i => i.type === 'SESSION').length,
        deadlines: active.filter(i => i.type === 'LEGAL_DEADLINE' || i.type === 'TASK_DEADLINE').length,
        tasks: active.filter(i => i.type === 'TASK_DEADLINE').length,
        other: active.filter(i => i.type === 'OTHER').length,
      };
    })
  );

  // ─── Calendar grids (observable from nav date subject) ────────────

  private navDateObs$: Observable<Date> = this.navDateSubject.asObservable();

  readonly monthGrid$: Observable<CalendarSlot[][]> = combineLatest([
    this.navDateObs$,
    this.activeItems$,
  ]).pipe(
    map(([d, items]) => buildMonthGrid(d.getFullYear(), d.getMonth(), items))
  );

  readonly weekGrid$: Observable<WeekSlot[]> = combineLatest([
    this.navDateObs$,
    this.activeItems$,
  ]).pipe(
    map(([d, items]) => buildWeekGrid(d, items))
  );

  // ─── View state (signal, not observable — UI-only) ────────────────
  readonly currentView = signal<'month' | 'week'>('month');
  readonly selectedAgendaItem = signal<AgendaItem | null>(null);

  readonly monthName$: Observable<string> = this.navDateSubject.pipe(
    map((d: Date) => d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }))
  );

  readonly weekRangeLabel$: Observable<string> = this.weekGrid$.pipe(
    map(days => {
      if (days.length === 0) return '';
      const start = days[0].date;
      const end = days[6].date;
      return `${start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} — ${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    })
  );

  // ─── Type helpers for template ──────────────────────────────────────
  readonly agendaItemTypes: AgendaItemType[] = ['SESSION', 'TASK_DEADLINE', 'LEGAL_DEADLINE', 'OTHER'];
  readonly typeIcon = typeIcon;
  readonly typeColor = typeColor;
  readonly priorityLabel = priorityLabel;
  readonly isCritical = isCriticalFn;
  readonly isOverdue = isOverdueFn;
  readonly isToday = isTodayFn;
  readonly formatTime = formatTime;
  readonly formatDateShort = formatDateShort;

  // ─── Deadline approaching alerts ──────────────────────────────────

  /** Reactive stream of deadline alerts from event bus. */
  readonly deadlineAlerts$ = new BehaviorSubject<Array<{
    type: 'approaching' | 'warning' | 'critical';
    caseId: number;
    title: string;
    date: Date;
  }>>([]);

  /** Highlight flag for calendar — true when any critical deadline event fires. */
  readonly hasCriticalAlert$ = this.deadlineAlerts$.pipe(
    map(alerts => alerts.some(a => a.type === 'critical')),
    startWith(false),
  );

  // ─── Lifecycle ──────────────────────────────────────────────────────
  ngOnInit(): void {
    this.agendaState.loadUpcoming();
    this.reminderState.loadPending();

    // CASE_SELECTED → filter by case
    this.subscriptions.add(
      this.events.on<number>(AppEventType.CASE_SELECTED).subscribe(caseId => {
        this.agendaState.loadItems(caseId);
      })
    );

    // DEADLINE_APPROACHING → visual alert (7-day window)
    this.subscriptions.add(
      this.events.on<{ caseId?: number; title?: string; date?: Date }>(AppEventType.DEADLINE_APPROACHING).subscribe(payload => {
        this._addDeadlineAlert('approaching', payload);
      })
    );

    // DEADLINE_WARNING → visual alert (3-day window)
    this.subscriptions.add(
      this.events.on<{ caseId?: number; title?: string; date?: Date }>(AppEventType.DEADLINE_WARNING).subscribe(payload => {
        this._addDeadlineAlert('warning', payload);
      })
    );

    // DEADLINE_CRITICAL → visual alert (24h window) + highlight calendar
    this.subscriptions.add(
      this.events.on<{ caseId?: number; title?: string; date?: Date }>(AppEventType.DEADLINE_CRITICAL).subscribe(payload => {
        this._addDeadlineAlert('critical', payload);
      })
    );

    // AGENDA_ITEM_ADDED/UPDATED/DELETED → calendar auto-refreshes via agendaItems$
    // (no explicit action needed — the BehaviorSubject stream handles it)
    this.subscriptions.add(
      this.events.on<{ caseId?: number }>(AppEventType.AGENDA_ITEM_ADDED).subscribe(payload => {
        if (payload.caseId) this.agendaState.loadItems(payload.caseId);
      })
    );

    this.subscriptions.add(
      this.events.on<{ caseId?: number }>(AppEventType.AGENDA_ITEM_DELETED).subscribe(payload => {
        if (payload.caseId) this.agendaState.loadItems(payload.caseId);
      })
    );

    // REMINDER_SENT → highlight in sidebar (auto-handled by ReminderStateService state update)
    // The pendingReminders$ stream refreshes when a reminder is sent.
    this.subscriptions.add(
      this.events.on<{ reminderId?: number }>(AppEventType.REMINDER_SENT).subscribe(() => {
        // Trigger a re-fetch of pending reminders to update sidebar highlight
        this.reminderState.loadPending();
      })
    );
  }

  /** Template-accessible: add a deadline alert from event bus */
  protected _addDeadlineAlert(type: 'approaching' | 'warning' | 'critical', payload: { caseId?: number; title?: string; date?: Date }): void {
    const alerts = this.deadlineAlerts$.value;
    alerts.push({
      type,
      caseId: payload.caseId ?? 0,
      title: payload.title ?? 'Échéance',
      date: payload.date ?? new Date(),
    });
    // Keep only last 10 alerts
    if (alerts.length > 10) alerts.splice(0, alerts.length - 10);
    this.deadlineAlerts$.next([...alerts]);
  }

  /** Template-accessible: dismiss a deadline alert by index */
  protected _dismissDeadlineAlert(index: number): void {
    const alerts = this.deadlineAlerts$.value;
    alerts.splice(index, 1);
    this.deadlineAlerts$.next([...alerts]);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // ─── Actions ────────────────────────────────────────────────────────

  /** Template fallback for async null */
  readonly activeFiltersFallback = new Set<AgendaItemType>();
  readonly statsFallback = { sessions: 0, deadlines: 0, tasks: 0, other: 0 };

  /** Template alias for ngFor track */
  protected get view(): 'month' | 'week' { return this.currentView(); }

  onFilterChange(event: { type: AgendaItemType; active: boolean }): void {
    const next = new Set(this.filterSubject.value);
    if (event.active) next.add(event.type);
    else next.delete(event.type);
    this.filterSubject.next(next);
  }

  toggleFilter(type: AgendaItemType): void {
    const next = new Set(this.filterSubject.value);
    if (next.has(type)) next.delete(type);
    else next.add(type);
    this.filterSubject.next(next);
  }

  clearFilters(): void {
    this.filterSubject.next(new Set());
  }

  navigateMonth(delta: number): void {
    const d = this.navDateSubject.value;
    if (this.currentView() === 'month') {
      this.navDateSubject.next(new Date(d.getFullYear(), d.getMonth() + delta, 1));
    } else {
      const next = new Date(d);
      next.setDate(next.getDate() + delta * 7);
      this.navDateSubject.next(next);
    }
  }

  goToToday(): void {
    this.navDateSubject.next(new Date());
  }

  addAgendaItem(): void {
    this.snackBar.open('Dialog d\'ajout d\'événement (à implémenter)', 'OK', { duration: 3000 });
  }

  openItemDetail(item: AgendaItem): void {
    this.selectedAgendaItem.set(item);
  }

  /** Drag & drop reschedule → update start date */
  onItemDropped(item: AgendaItem, newDate: Date): void {
    this.itemUpdated.emit({ id: item.id, changes: { startDate: newDate } as Partial<AgendaItem> });
    this.agendaState.updateItem(item.id, { startDate: newDate.toISOString() });
    this.snackBar.open(`${item.title} replannifié`, 'OK', { duration: 2000 });
  }

  /** Child @Output → calls state service + emits for parent listeners */
  completeItem(id: number): void {
    this.itemCompleted.emit(id);
    this.agendaState.completeItem(id);
    this.snackBar.open('Élément marqué comme terminé', 'OK', { duration: 2000 });
  }

  snoozeReminder(id: number): void {
    this.reminderSnoozed.emit(id);
    this.reminderState.updateReminder(id, {
      reminderDate: new Date(Date.now() + 60 * 60 * 1000),
    });
    this.snackBar.open('Rappel reporté d\'1 heure', 'OK', { duration: 2000 });
  }

  dismissReminder(id: number): void {
    this.reminderDismissed.emit(id);
    this.reminderState.sendReminder(id);
    this.snackBar.open('Rappel envoyé', 'OK', { duration: 2000 });
  }

  t(key: string): string {
    return this.translation.t(key);
  }

  /** Template helper for filter chip active state */
  hasFilter(filters: Set<AgendaItemType>, type: AgendaItemType): boolean {
    return filters.has(type);
  }
}
