import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
interface ReminderInfo {
  id: number;
  agendaItemId: number;
  reminderDate: Date;
  sent: boolean;
  method: 'IN_APP' | 'EMAIL';
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

@Component({
  selector: 'app-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatListModule,
    MatBadgeModule,
    MatTooltipModule,
  ],
  template: `
    <!-- Upcoming Reminders (48h) -->
    <mat-card class="panel-card reminders-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon [matBadge]="totalReminders"
                    matBadgeColor="warn"
                    [matBadgeHidden]="totalReminders === 0">
            notifications
          </mat-icon>
          Rappels — 48h
        </mat-card-title>
      </mat-card-header>
      <mat-card-content>
        @if ((upcomingSessions?.length ?? 0) === 0 && (pendingReminders?.length ?? 0) === 0) {
          <div class="empty-state">
            <mat-icon>notifications_none</mat-icon>
            <p>Aucun rappel</p>
          </div>
        } @else {
          <mat-list>
            @for (session of upcomingSessions ?? []; track session.id) {
              <mat-list-item class="reminder-item session-reminder">
                <mat-icon matListItemIcon style="color: #ea3f48;">gavel</mat-icon>
                <div matListItemTitle class="item-title">{{ session.title }}</div>
                <div matListItemLine class="item-meta">
                  {{ formatDateShort(session.startDate) }} · {{ formatTime(session.startDate) }}
                </div>
              </mat-list-item>
            }
            @for (r of pendingReminders ?? []; track r.id) {
              <mat-list-item class="reminder-item">
                <mat-icon matListItemIcon style="color: #6366f1;">
                  {{ r.method === 'EMAIL' ? 'email' : 'notifications' }}
                </mat-icon>
                <div matListItemTitle class="item-title">Rappel #{{ r.id }}</div>
                <div matListItemLine class="item-meta">
                  {{ formatDateShort(r.reminderDate) }} · {{ formatTime(r.reminderDate) }}
                </div>
                <span matListItemMeta class="item-actions">
                  <button mat-icon-button size="small" [matTooltip]="'Envoyer'" (click)="dismissReminder.emit(r.id)">
                    <mat-icon>send</mat-icon>
                  </button>
                </span>
              </mat-list-item>
            }
          </mat-list>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .panel-card {
      margin-bottom: 1rem;
      border-radius: 18px !important;
      border: 1px solid #e5eaf2;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
      background: #ffffff;
      &:last-child { margin-bottom: 0; }

      mat-card-header {
        padding: 1rem 1.15rem 0.75rem !important;
        border-bottom: 1px solid #e5e7eb;
      }
      mat-card-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.95rem;
        font-weight: 800;
        color: #0f172a;
        letter-spacing: 0.01em;
        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
          color: #64748b;
        }
      }
      mat-card-content { padding: 0.9rem 0 !important; }
    }

    .reminders-card {
      border-left: 4px solid #f59e0b;
      background: linear-gradient(180deg, #ffffff 0%, #fffdf7 100%);
    }

    .reminder-item {
      padding: 0.55rem 1rem !important;
      border-radius: 10px;
      margin: 0.15rem 0.6rem 0.15rem 1.2rem;
      border: 1px solid #eef2f7;
      position: relative;
      transition: all 0.2s ease;
      &:hover { transform: translateY(-1px); box-shadow: 0 8px 16px rgba(15, 23, 42, 0.08); }
      &::before {
        content: '';
        position: absolute;
        left: -10px;
        top: 50%;
        width: 8px;
        height: 8px;
        transform: translateY(-50%);
        border-radius: 50%;
        background: #94a3b8;
      }
    }
    .session-reminder {
      border-left: 3px solid #ea3f48;
      background: #fffafa;
      &::before { background: #ea3f48; }
    }
    .item-title { font-size: 0.84rem; font-weight: 700; color: #0f172a; }
    .item-meta { font-size: 0.75rem; color: #64748b; margin-top: 0.15rem; }
    .item-actions { display: flex; gap: 0.15rem; }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1.8rem 1rem;
      color: #94a3b8;
      mat-icon {
        font-size: 38px;
        width: 38px;
        height: 38px;
        margin-bottom: 0.4rem;
      }
      p { font-size: 0.82rem; margin: 0; }
    }
  `],
})
export class FilterPanelComponent {
  @Input() upcomingSessions: Array<{ id: number; title: string; startDate: Date }> | null = null;
  @Input() pendingReminders: ReminderInfo[] | null = null;

  @Output() dismissReminder = new EventEmitter<number>();
  readonly formatTime = formatTime;
  readonly formatDateShort = formatDateShort;

  get totalReminders(): number {
    return (this.upcomingSessions?.length ?? 0) + (this.pendingReminders?.length ?? 0);
  }

}
