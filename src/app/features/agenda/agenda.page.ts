import { Component, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslationService } from '../../core/services/translation.service';
import { AgendaStateService } from './services/agenda-state.service';
import { AgendaItem, AgendaItemType, AgendaItemStatus, AgendaItemPriority } from '../../core/models/agenda-item.model';
import { Subscription } from 'rxjs';

interface CalendarDay {
  date: string;
  dayNum: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: AgendaItem[];
}

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatDialogModule,
    MatChipsModule, MatDatepickerModule, MatNativeDateModule, MatSnackBarModule,
    MatTooltipModule,
  ],
  template: `
    <div class="agenda-header">
      <h1>{{ t('agenda.title') }}</h1>
      <div class="header-actions">
        <div class="view-toggles">
          @for (view of views; track view.key) {
            <button
              mat-button
              [class.active]="currentView() === view.key"
              (click)="setView(view.key)">
              {{ t('agenda.' + view.key) }}
            </button>
          }
        </div>
        <button mat-flat-button (click)="openAddDialog()">
          <mat-icon>add</mat-icon>
          {{ t('agenda.addEvent') }}
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-number">{{ agendaItems().length }}</span>
        <span class="stat-label">{{ t('agenda.totalEvents') }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ thisMonthEvents() }}</span>
        <span class="stat-label">{{ t('agenda.thisMonth') }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ upcomingCount() }}</span>
        <span class="stat-label">{{ t('agenda.upcoming') }}</span>
      </div>
    </div>

    <!-- Filter -->
    <div class="filter-row">
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>{{ t('agenda.filterByType') }}</mat-label>
        <mat-select [formControl]="filterControl" (selectionChange)="onFilterChange()">
          <mat-option value="">{{ t('agenda.allTypes') }}</mat-option>
          @for (type of agendaItemTypes; track type.key) {
            <mat-option [value]="type.key">{{ t('agenda.' + type.key) }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </div>

    <!-- Calendar Grid -->
    <div class="calendar-container">
      <div class="calendar-header">
        <button mat-icon-button (click)="prevMonth()"><mat-icon>chevron_left</mat-icon></button>
        <h2>{{ currentMonthName }} {{ currentYear() }}</h2>
        <button mat-icon-button (click)="nextMonth()"><mat-icon>chevron_right</mat-icon></button>
      </div>

      <div class="calendar-grid">
        <div class="day-header">Dim</div>
        <div class="day-header">Lun</div>
        <div class="day-header">Mar</div>
        <div class="day-header">Mer</div>
        <div class="day-header">Jeu</div>
        <div class="day-header">Ven</div>
        <div class="day-header">Sam</div>

        @for (week of calendarDays(); track week) {
          @for (day of week; track day.date) {
            <div
              class="calendar-day"
              [class.other-month]="!day.isCurrentMonth"
              [class.today]="day.isToday"
              [class.has-events]="day.events.length > 0"
              [class.has-critical]="hasCriticalDeadline(day.events)"
              (click)="selectedDay.set(day.date)">
              <span class="day-number">{{ day.dayNum }}</span>
              @if (hasCriticalDeadline(day.events)) {
                <span class="critical-indicator">⚠</span>
              }
              @if (day.events.length > 0) {
                <div class="event-dots">
                  @for (event of day.events.slice(0, 3); track event.id) {
                    <span class="event-dot" [class]="'dot-' + event.type.toLowerCase()"></span>
                  }
                </div>
              }
            </div>
          }
        }
      </div>
    </div>

    <!-- Selected Day Events -->
    @if (selectedDayEvents().length > 0) {
      <mat-card class="events-list-card">
        <mat-card-header>
          <mat-card-title>Événements du {{ selectedDay() }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          @for (item of selectedDayEvents(); track item.id) {
            <div class="event-item" [class.critical-item]="item.type === 'LEGAL_DEADLINE'">
              <div class="event-type-badge" [class]="'badge-' + item.type.toLowerCase()" [class.badge-critical]="item.type === 'LEGAL_DEADLINE'">
                {{ t('agenda.' + item.type) }}
              </div>
              <div class="event-details">
                <h4>{{ item.title }}</h4>
                @if (item.description) {
                  <p>{{ item.description }}</p>
                }
                <div class="event-meta">
                  <span><mat-icon>schedule</mat-icon> {{ item.startDate | date:'shortTime' }}</span>
                  @if (item.location) {
                    <span><mat-icon>location_on</mat-icon> {{ item.location }}</span>
                  }
                  @if (item.priority) {
                    <span><mat-icon>flag</mat-icon> {{ t('agenda.' + item.priority) }}</span>
                  }
                </div>
              </div>
              <div class="event-actions">
                <button mat-icon-button [matTooltip]="t('agenda.editEvent')" (click)="openEditDialog(item)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button [matTooltip]="t('agenda.deleteEvent')" (click)="deleteItem(item.id)">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
          }
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: [`
    .agenda-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .agenda-header h1 {
      font-size: 1.75rem;
      font-weight: 800;
      color: #0f2d5e;
      margin: 0;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .view-toggles {
      display: flex;
      gap: 0.25rem;
    }
    .view-toggles button {
      color: #64748b;
    }
    .view-toggles button.active {
      background: #ea3f48;
      color: white;
    }
    .stats-row {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .stat-item {
      background: white;
      border-radius: 12px;
      padding: 1rem 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .stat-number {
      font-size: 1.5rem;
      font-weight: 800;
      color: #ea3f48;
    }
    .stat-label {
      font-size: 0.85rem;
      color: #64748b;
    }
    .filter-row {
      margin-bottom: 1.5rem;
    }
    .calendar-container {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .calendar-header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .calendar-header h2 {
      font-size: 1.25rem;
      font-weight: 700;
      color: #0f2d5e;
      margin: 0;
      min-width: 200px;
      text-align: center;
    }
    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 4px;
    }
    .day-header {
      text-align: center;
      font-weight: 600;
      font-size: 0.8rem;
      color: #94a3b8;
      padding: 0.5rem 0;
    }
    .calendar-day {
      aspect-ratio: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      cursor: pointer;
      transition: background 0.15s;
      position: relative;
      min-height: 60px;
    }
    .calendar-day:hover {
      background: #f1f5f9;
    }
    .calendar-day.other-month {
      opacity: 0.3;
    }
    .calendar-day.today {
      background: linear-gradient(135deg, #ea3f48, #c8333d);
      color: white;
    }
    .calendar-day.today .day-number {
      color: white;
    }
    .calendar-day.has-events {
      font-weight: 700;
    }
    .calendar-day.has-critical {
      box-shadow: inset 0 0 0 2px #f59e0b;
    }
    .critical-indicator {
      font-size: 0.75rem;
      line-height: 1;
    }
    .day-number {
      font-size: 0.9rem;
      color: #0f2d5e;
    }
    .event-dots {
      display: flex;
      gap: 3px;
      margin-top: 2px;
    }
    .event-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }
    .dot-session { background: #ea3f48; }
    .dot-task_deadline { background: #14b8a6; }
    .dot-legal_deadline { background: #f59e0b; }
    .dot-other { background: #6366f1; }
    .events-list-card {
      border-radius: 16px !important;
    }
    .event-item {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem 0;
      border-bottom: 1px solid #f1f5f9;
    }
    .event-item:last-child { border-bottom: none; }
    .event-type-badge {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .badge-session { background: #fef2f2; color: #ea3f48; }
    .badge-task_deadline { background: #f0fdfa; color: #14b8a6; }
    .badge-legal_deadline { background: #fff7ed; color: #f59e0b; }
    .badge-critical { background: #fef2f2; color: #dc2626; border: 1px solid #dc2626; animation: pulse-critical 2s infinite; }
    .badge-other { background: #eef2ff; color: #6366f1; }
    .event-item.critical-item {
      border-left: 3px solid #dc2626;
      padding-left: calc(1rem - 3px);
      background: #fff5f5;
      border-radius: 4px;
    }
    @keyframes pulse-critical {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    .event-details {
      flex: 1;
    }
    .event-details h4 {
      margin: 0 0 0.25rem;
      font-size: 0.95rem;
      color: #0f2d5e;
    }
    .event-details p {
      margin: 0 0 0.5rem;
      font-size: 0.85rem;
      color: #64748b;
    }
    .event-meta {
      display: flex;
      gap: 1rem;
      font-size: 0.8rem;
      color: #94a3b8;
    }
    .event-meta span {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    .event-meta mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    .event-actions {
      display: flex;
      gap: 0.25rem;
    }
  `],
})
export class AgendaPage implements OnDestroy {
  private agendaState = inject(AgendaStateService);
  private translation = inject(TranslationService);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  private subscriptions = new Subscription();

  views = [
    { key: 'month', label: 'Mois' },
    { key: 'week', label: 'Semaine' },
    { key: 'day', label: 'Jour' },
    { key: 'list', label: 'Liste' },
  ];

  agendaItemTypes: Array<{ key: AgendaItemType }> = [
    { key: 'SESSION' },
    { key: 'TASK_DEADLINE' },
    { key: 'LEGAL_DEADLINE' },
    { key: 'OTHER' },
  ];

  currentView = signal<'month' | 'week' | 'day' | 'list'>('month');
  filterControl = new FormControl('');
  selectedDay = signal('');

  private currentDateSignal = signal(new Date());
  currentMonth = computed(() => this.currentDateSignal().getMonth());
  currentYear = computed(() => this.currentDateSignal().getFullYear());

  get currentMonthName(): string {
    return this.currentDateSignal().toLocaleDateString('fr-FR', { month: 'long' });
  }

  // ─── State-backed agenda items ──────────────────────────────────

  agendaItems = signal<AgendaItem[]>([]);

  filteredEvents = computed(() => {
    const filter = this.filterControl.value;
    if (!filter) return this.agendaItems();
    return this.agendaItems().filter(e => e.type === filter);
  });

  thisMonthEvents = computed(() => {
    const month = this.currentMonth();
    const year = this.currentYear();
    return this.filteredEvents().filter(e => {
      const d = e.startDate;
      return d.getMonth() === month && d.getFullYear() === year;
    }).length;
  });

  upcomingCount = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.filteredEvents().filter(e => e.startDate >= today && e.status !== 'COMPLETED' && e.status !== 'MISSED').length;
  });

  selectedDayEvents = computed(() => {
    const day = this.selectedDay();
    if (!day) return [];
    const target = new Date(day);
    return this.filteredEvents().filter(e => {
      const d = e.startDate;
      return d.getFullYear() === target.getFullYear() &&
             d.getMonth() === target.getMonth() &&
             d.getDate() === target.getDate();
    });
  });

  calendarDays = computed(() => {
    const year = this.currentYear();
    const month = this.currentMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const days: Array<Array<CalendarDay>> = [];
    const startOffset = firstDay.getDay();

    let current = new Date(firstDay);
    current.setDate(current.getDate() - startOffset);

    for (let week = 0; week < 6; week++) {
      const weekDays: CalendarDay[] = [];
      for (let day = 0; day < 7; day++) {
        const dateStr = current.toISOString().split('T')[0];
        const dayEvents = this.filteredEvents().filter(e => {
          const ed = e.startDate.toISOString().split('T')[0];
          return ed === dateStr;
        });
        weekDays.push({
          date: dateStr,
          dayNum: current.getDate(),
          isCurrentMonth: current.getMonth() === month,
          isToday: dateStr === todayStr,
          events: dayEvents,
        });
        current.setDate(current.getDate() + 1);
      }
      days.push(weekDays);
      if (current > lastDay && week >= 4) break;
    }

    return days;
  });

  constructor() {
    // Subscribe to state changes and populate signal
    this.subscriptions.add(
      this.agendaState.state$.subscribe(state => {
        this.agendaItems.set(state.items);
      })
    );

    // Load upcoming items on init (across all cases)
    this.agendaState.loadUpcoming();
  }

  prevMonth() {
    const d = this.currentDateSignal();
    this.currentDateSignal.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  nextMonth() {
    const d = this.currentDateSignal();
    this.currentDateSignal.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  setView(key: string) {
    this.currentView.set(key as 'month' | 'week' | 'day' | 'list');
  }

  onFilterChange() {
    // Trigger recomputation via filterControl
  }

  openAddDialog() {
    this.snackBar.open('Dialog d\'ajout d\'événement (à implémenter)', 'OK', { duration: 3000 });
  }

  openEditDialog(item: AgendaItem) {
    this.snackBar.open('Modification: ' + item.title, 'OK', { duration: 3000 });
  }

  deleteItem(id: number) {
    this.agendaState.deleteItem(id);
    this.snackBar.open('Élément supprimé', 'OK', { duration: 2000 });
  }

  hasCriticalDeadline(events: AgendaItem[]): boolean {
    const now = Date.now();
    const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
    return events.some(
      e =>
        e.type === 'LEGAL_DEADLINE' &&
        e.startDate.getTime() >= now &&
        e.startDate.getTime() - now <= THREE_DAYS &&
        e.status !== 'COMPLETED' &&
        e.status !== 'MISSED'
    );
  }

  t(key: string): string {
    return this.translation.t(key);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
