import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
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

@Component({
  selector: 'app-agenda-item-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatTooltipModule],
  template: `
    <div
      class="agenda-item-card"
      [class.critical]="isCritical(item)"
      [class.overdue]="isOverdue(item)"
      (click)="open.emit(item)">
      <div class="aic-header">
        <mat-icon class="aic-icon" [style.color]="typeColor(item.type)">{{ typeIcon(item.type) }}</mat-icon>
        <span class="aic-type-label">{{ typeLabel(item.type) }}</span>
        @if (item.priority) {
          <span class="aic-priority">{{ priorityLabel(item.priority) }}</span>
        }
      </div>
      <div class="aic-title">{{ item.title }}</div>
      @if (item.description) {
        <div class="aic-desc">{{ item.description }}</div>
      }
      <div class="aic-meta">
        <span><mat-icon class="tiny">schedule</mat-icon> {{ formatTime(item.startDate) }}</span>
        @if (item.location) {
          <span><mat-icon class="tiny">location_on</mat-icon> {{ item.location }}</span>
        }
        @if (item.caseId) {
          <span><mat-icon class="tiny">folder</mat-icon> Dossier #{{ item.caseId }}</span>
        }
      </div>
      <div class="aic-actions">
        @if (!completeOnly) {
          <button mat-button size="small" (click)="$event.stopPropagation(); complete.emit(item.id)">
            <mat-icon>check_circle</mat-icon> Terminer
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .agenda-item-card {
      background: white;
      border-radius: 12px;
      padding: 0.75rem;
      border: 1px solid #eef2f7;
      border-left: 3px solid transparent;
      cursor: pointer;
      transition: box-shadow 0.2s ease, transform 0.2s ease;

      &:hover {
        box-shadow: 0 12px 24px rgba(15, 23, 42, 0.1);
        transform: translateY(-2px);
      }

      &.critical {
        border-left-color: #dc2626;
        background: #fffafa;
      }

      &.overdue {
        border-left-color: #f59e0b;
        background: #fffdf5;
      }
    }

    .aic-header {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      margin-bottom: 0.25rem;
    }

    .aic-icon {
      font-size: 16px !important;
      width: 16px !important;
      height: 16px !important;
    }

    .aic-type-label {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
    }

    .aic-priority {
      margin-left: auto;
      font-size: 0.75rem;
    }

    .aic-title {
      font-size: 0.9rem;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.3;
      margin-bottom: 0.2rem;
    }

    .aic-desc {
      font-size: 0.78rem;
      color: #64748b;
      line-height: 1.4;
      margin-bottom: 0.35rem;
    }

    .aic-meta {
      display: flex;
      gap: 0.75rem;
      font-size: 0.7rem;
      color: #94a3b8;

      span {
        display: flex;
        align-items: center;
        gap: 0.125rem;
      }
    }

    .tiny {
      font-size: 12px !important;
      width: 12px !important;
      height: 12px !important;
    }

    .aic-actions {
      margin-top: 0.5rem;
      display: flex;
      gap: 0.25rem;
    }
  `],
})
export class AgendaItemCardComponent {
  @Input({ required: true }) item!: AgendaItem;
  @Input() completeOnly = false;

  @Output() open = new EventEmitter<AgendaItem>();
  @Output() complete = new EventEmitter<number>();
  @Output() miss = new EventEmitter<number>();

  readonly typeIcon = typeIcon;
  readonly typeColor = typeColor;
  readonly formatTime = formatTime;
  readonly formatDateShort = formatDateShort;
  readonly isCritical = isCriticalFn;
  readonly isOverdue = isOverdueFn;

  typeLabel(type: AgendaItemType): string {
    const labels: Record<AgendaItemType, string> = {
      SESSION: 'Session',
      TASK_DEADLINE: 'Échéance tâche',
      LEGAL_DEADLINE: 'Échéance légale',
      OTHER: 'Autre',
    };
    return labels[type];
  }

  priorityLabel(priority: AgendaItem['priority']): string {
    switch (priority) {
      case 'HIGH': return '🔴';
      case 'MEDIUM': return '🟡';
      default: return '';
    }
  }
}
