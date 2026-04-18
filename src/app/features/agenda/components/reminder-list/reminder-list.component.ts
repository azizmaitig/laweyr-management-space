import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import type { AgendaItem, AgendaItemType } from '../../../../core/models/agenda-item.model';

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

function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
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

interface ReminderInfo {
  id: number;
  agendaItemId: number;
  reminderDate: Date;
  sent: boolean;
  method: 'IN_APP' | 'EMAIL';
}

@Component({
  selector: 'app-reminder-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatListModule,
    MatBadgeModule,
    MatTooltipModule,
    MatButtonModule,
  ],
  template: `
    <!-- Today's Agenda -->
    <mat-card class="panel-card today-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>today</mat-icon>
          Aujourd'hui ({{ todayItems.length }})
        </mat-card-title>
      </mat-card-header>
      <mat-card-content>
        @if (todayItems.length === 0) {
          <div class="empty-state">
            <mat-icon>event_busy</mat-icon>
            <p>Rien aujourd'hui</p>
          </div>
        } @else {
          <mat-list>
            @for (item of todayItems; track item.id) {
              <mat-list-item class="today-item" [class.critical]="isCritical(item)">
                <mat-icon matListItemIcon [style.color]="typeColor(item.type)">{{ typeIcon(item.type) }}</mat-icon>
                <div matListItemTitle class="item-title-row">
                  <span class="item-title">{{ item.title }}</span>
                </div>
                <div matListItemLine class="item-meta">
                  {{ formatTime(item.startDate) }}
                  @if (item.location) { · {{ item.location }} }
                </div>
                <span matListItemMeta class="item-actions">
                  <button mat-icon-button size="small" [matTooltip]="'Terminé'" (click)="completeItem.emit(item.id)">
                    <mat-icon>check_circle</mat-icon>
                  </button>
                </span>
              </mat-list-item>
            }
          </mat-list>
        }
      </mat-card-content>
    </mat-card>

    <!-- Alerts: Critical, Overdue, Deadline Events -->
    @if (criticalDeadlines.length > 0 || overdueItems.length > 0 || deadlineAlerts.length > 0) {
      <mat-card class="panel-card alerts-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon style="color: #dc2626;"
                      [matBadge]="hasCriticalAlert ? '!' : null"
                      matBadgeColor="warn">warning</mat-icon>
            Alertes
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <!-- Event-driven deadline alerts -->
          @for (alert of deadlineAlerts; track alert.title + alert.date.getTime(); let idx = $index) {
            <mat-list-item class="alert-item" [ngClass]="{
              'deadline-approaching': alert.type === 'approaching',
              'deadline-warning': alert.type === 'warning',
              'deadline-critical': alert.type === 'critical'
            }">
              <mat-icon matListItemIcon>
                @if (alert.type === 'critical') { error }
                @if (alert.type === 'warning') { warning }
                @if (alert.type === 'approaching') { schedule }
              </mat-icon>
              <div matListItemTitle class="item-title">{{ alert.title }}</div>
              <div matListItemLine class="item-meta">{{ formatDateShort(alert.date) }}</div>
              <span matListItemMeta>
                <button mat-icon-button size="small" [matTooltip]="'Fermer'" (click)="dismissDeadlineAlert.emit(idx)">
                  <mat-icon>close</mat-icon>
                </button>
              </span>
            </mat-list-item>
          }

          @if (criticalDeadlines.length > 0) {
            <h4 class="alert-subtitle">Échéances critiques</h4>
            <mat-list>
              @for (item of criticalDeadlines; track item.id) {
                <mat-list-item class="alert-item critical">
                  <mat-icon matListItemIcon style="color: #dc2626;">balance</mat-icon>
                  <div matListItemTitle class="item-title">{{ item.title }}</div>
                  <div matListItemLine class="item-meta">
                    {{ formatDateShort(item.startDate) }} · {{ formatTime(item.startDate) }}
                  </div>
                </mat-list-item>
              }
            </mat-list>
          }

          @if (overdueItems.length > 0) {
            <h4 class="alert-subtitle">En retard</h4>
            <mat-list>
              @for (item of overdueItems; track item.id) {
                <mat-list-item class="alert-item overdue">
                  <mat-icon matListItemIcon style="color: #f59e0b;">schedule</mat-icon>
                  <div matListItemTitle class="item-title">{{ item.title }}</div>
                  <div matListItemLine class="item-meta">{{ formatDateShort(item.startDate) }}</div>
                  <span matListItemMeta class="item-actions">
                    <button mat-icon-button size="small" [matTooltip]="'Terminé'" (click)="completeItem.emit(item.id)">
                      <mat-icon>check_circle</mat-icon>
                    </button>
                  </span>
                </mat-list-item>
              }
            </mat-list>
          }
        </mat-card-content>
      </mat-card>
    }

    <!-- Quick Actions -->
    <mat-card class="panel-card actions-card">
      <mat-card-header><mat-card-title>Actions rapides</mat-card-title></mat-card-header>
      <mat-card-content>
        <div class="quick-actions">
          <button mat-stroked-button class="qa-btn" (click)="addItem.emit()">
            <mat-icon>add_circle_outline</mat-icon> Nouvel élément
          </button>
          <button mat-stroked-button class="qa-btn" (click)="goToToday.emit()">
            <mat-icon>today</mat-icon> Aller à aujourd'hui
          </button>
          <button mat-stroked-button class="qa-btn" (click)="clearFilters.emit()">
            <mat-icon>filter_list_off</mat-icon> Réinitialiser filtres
          </button>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .panel-card {
      border-radius: 18px !important;
      margin-bottom: 1rem;
      border: 1px solid #e5eaf2;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
      background: #ffffff;
      &:last-child { margin-bottom: 0; }
      mat-card-header { padding: 1rem 1.15rem 0.75rem !important; border-bottom: 1px solid #e5e7eb; }
      mat-card-title {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        font-size: 0.95rem;
        font-weight: 800;
        color: #0f172a;
        letter-spacing: 0.01em;
        mat-icon { font-size: 20px; width: 20px; height: 20px; color: #64748b; }
      }
      mat-card-content { padding: 0.8rem 0 !important; }
    }
    .today-card {
      border-left: 4px solid #0ea5e9;
      background: linear-gradient(180deg, #ffffff 0%, #f4fbff 100%);
    }
    .today-item {
      padding: 0.6rem 1rem !important;
      border-radius: 12px;
      margin: 0.12rem 0.55rem;
      border: 1px solid #eef2f7;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      &:hover { transform: translateY(-1px); box-shadow: 0 8px 16px rgba(15, 23, 42, 0.08); }
    }
    .today-item.critical { border-left: 3px solid #dc2626; background: #fffafa; border-color: #fee2e2; }
    .alerts-card {
      border-left: 4px solid #dc2626;
      background: linear-gradient(180deg, #ffffff 0%, #fff7f7 100%);
    }
    .actions-card { }

    .alert-subtitle {
      font-size: 0.72rem;
      font-weight: 800;
      color: #64748b;
      text-transform: uppercase;
      margin: 0.65rem 1rem 0.25rem;
      letter-spacing: 0.05em;
      padding: 0;
    }
    .alert-item {
      padding: 0.55rem 1rem !important;
      border-radius: 12px;
      margin: 0.14rem 0.55rem;
      border: 1px solid #eef2f7;
      transition: all 0.2s ease;
    }
    .alert-item.critical { border-left: 3px solid #dc2626; background: #fffafa; }
    .alert-item.overdue { border-left: 3px solid #f59e0b; background: #fffdf8; }
    .alert-item.deadline-approaching { border-left: 3px solid #f59e0b; background: #fffdf8; }
    .alert-item.deadline-warning { border-left: 3px solid #d97706; background: #fffcf5; }
    .alert-item.deadline-critical {
      background: #fffafa;
      border-left: 3px solid #dc2626;
      border-color: #fee2e2;
    }

    .item-title-row { display: flex; justify-content: space-between; align-items: center; }
    .item-title { font-size: 0.84rem; font-weight: 700; color: #0f172a; }
    .item-meta { font-size: 0.75rem; color: #64748b; margin-top: 0.15rem; }
    .item-actions { display: flex; gap: 0.125rem; }

    .quick-actions { display: flex; flex-direction: column; gap: 0.55rem; padding: 0.3rem 1rem 0.15rem; }
    .qa-btn {
      text-transform: none !important;
      justify-content: flex-start;
      text-align: left;
      border-radius: 10px;
      border-color: #e2e8f0 !important;
      font-weight: 600;
      mat-icon { margin-right: 0.4rem; }
      transition: all 0.2s ease;
      &:hover { background: #f8fafc; transform: translateY(-1px); }
    }

    .empty-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 1.8rem 1rem; color: #94a3b8;
      mat-icon { font-size: 38px; width: 38px; height: 38px; margin-bottom: 0.4rem; }
      p { font-size: 0.82rem; margin: 0; }
    }

  `],
})
export class ReminderListComponent {
  @Input() todayItems: AgendaItem[] = [];
  @Input() criticalDeadlines: AgendaItem[] = [];
  @Input() overdueItems: AgendaItem[] = [];
  @Input() pendingReminders: ReminderInfo[] | null = null;
  @Input() deadlineAlerts: Array<{ type: 'approaching' | 'warning' | 'critical'; caseId: number; title: string; date: Date }> = [];
  @Input() hasCriticalAlert = false;

  @Output() completeItem = new EventEmitter<number>();
  @Output() snoozeReminder = new EventEmitter<number>();
  @Output() dismissReminder = new EventEmitter<number>();
  @Output() dismissDeadlineAlert = new EventEmitter<number>();
  @Output() addItem = new EventEmitter<void>();
  @Output() goToToday = new EventEmitter<void>();
  @Output() clearFilters = new EventEmitter<void>();

  readonly typeIcon = typeIcon;
  readonly typeColor = typeColor;
  readonly formatTime = formatTime;
  readonly formatDateShort = formatDateShort;
  readonly isCritical = isCriticalFn;
  readonly isOverdue = isOverdueFn;
}
