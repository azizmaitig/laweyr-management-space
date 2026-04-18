import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonModule } from '@angular/material/button';
import type { AgendaItem, AgendaItemType } from '../../../../core/models/agenda-item.model';

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

@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    MatCardModule,
    MatIconModule,
    MatTooltipModule,
    MatButtonToggleModule,
    MatButtonModule,
  ],
  template: `
    <mat-card class="calendar-card" [class.critical-alert]="hasCriticalAlert">
      @if (showToolbar) {
        <!-- Top Bar -->
        <div class="calendar-toolbar">
          <div class="calendar-toolbar-left">
            <mat-button-toggle-group [value]="view" (valueChange)="viewChange.emit($event)" appearance="standard">
              <mat-button-toggle value="month">
                <mat-icon>calendar_month</mat-icon>
                Mois
              </mat-button-toggle>
              <mat-button-toggle value="week">
                <mat-icon>view_week</mat-icon>
                Semaine
              </mat-button-toggle>
            </mat-button-toggle-group>
            <h2 class="period-label">{{ periodLabel }}</h2>
            <button mat-icon-button (click)="navigate.emit(-1)" [matTooltip]="'Précédent'">
              <mat-icon>chevron_left</mat-icon>
            </button>
            <button mat-icon-button (click)="navigate.emit(1)" [matTooltip]="'Suivant'">
              <mat-icon>chevron_right</mat-icon>
            </button>
          </div>
          <div class="calendar-toolbar-right">
            <button mat-stroked-button class="today-btn" (click)="today.emit()">
              <mat-icon>today</mat-icon>
              Aujourd'hui
            </button>
            <button mat-flat-button color="warn" (click)="add.emit()">
              <mat-icon>add</mat-icon>
              Ajouter
            </button>
          </div>
        </div>
      }

      <mat-card-content>
        <!-- MONTH VIEW -->
        @if (view === 'month' && monthGrid.length > 0) {
          <div class="month-view">
            <div class="day-headers">
              <span>Dim</span><span>Lun</span><span>Mar</span><span>Mer</span>
              <span>Jeu</span><span>Ven</span><span>Sam</span>
            </div>
            @for (week of monthGrid; track week) {
              <div class="calendar-week">
                @for (slot of week; track slot.date.getTime()) {
                  <div
                    class="calendar-day"
                    [class.other-month]="!slot.isCurrentMonth"
                    [class.today]="slot.isToday">
                    <span class="day-number">{{ slot.dayNum }}</span>
                    @if (slot.items.length > 0) {
                      <div class="day-items">
                        @for (item of slot.items.slice(0, 4); track item.id) {
                          <div
                            class="day-item-badge"
                            [matTooltip]="item.title + ' — ' + formatTime(item.startDate)"
                            [style.--tag-color]="typeColor(item.type)"
                            (click)="openItem.emit(item)">
                            {{ isCritical(item) ? '⚠ ' : '' }}{{ item.title | slice:0:18 }}{{ item.title.length > 18 ? '…' : '' }}
                          </div>
                        }
                        @if (slot.items.length > 4) {
                          <span class="more-items">+{{ slot.items.length - 4 }} de plus</span>
                        }
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- WEEK VIEW -->
        @if (view === 'week' && weekGrid.length > 0) {
          <div class="week-view">
            <div class="week-header-row">
              @for (day of weekGrid; track day.date.getTime()) {
                <div class="week-day-header" [class.today]="day.isToday">
                  <span class="wdh-name">{{ day.dayName }}</span>
                  <span class="wdh-num">{{ day.dayNum }}</span>
                </div>
              }
            </div>
            @for (day of weekGrid; track day.date.getTime(); let idx = $index) {
              <div
                class="week-day-column"
                cdkDropList
                [cdkDropListData]="idx"
                [class.today-col]="day.isToday"
                (cdkDropListDropped)="onItemDrop($event)">
                @if (day.items.length === 0) {
                  <div class="empty-day">—</div>
                } @else {
                  @for (item of day.items; track item.id) {
                    <div
                      class="week-item-block"
                      cdkDrag
                      [cdkDragData]="item"
                      [style.border-left-color]="typeColor(item.type)"
                      [class.critical]="isCritical(item)"
                      [class.overdue]="isOverdue(item)"
                      [matTooltip]="item.title + '\n' + formatTime(item.startDate) + (item.location ? ' · ' + item.location : '')"
                      (click)="openItem.emit(item)">
                      <div class="wi-header">
                        <mat-icon class="wi-icon" [style.color]="typeColor(item.type)">{{ typeIcon(item.type) }}</mat-icon>
                        <span class="wi-time">{{ formatTime(item.startDate) }}</span>
                        <span class="wi-priority">{{ priorityLabel(item.priority) }}</span>
                      </div>
                      <div class="wi-title">{{ item.title }}</div>
                      @if (item.description) {
                        <div class="wi-desc">{{ item.description | slice:0:60 }}</div>
                      }
                    </div>
                  }
                }
              </div>
            }
          </div>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .calendar-card {
      border-radius: 20px !important;
      border: none;
      box-shadow: 0 14px 35px rgba(15, 23, 42, 0.08);
      background: #ffffff;
      transition: box-shadow 0.25s ease, border-color 0.25s ease;
      &.critical-alert {
        box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.18), 0 14px 35px rgba(15, 23, 42, 0.12);
        animation: pulse-calendar-border 2s infinite;
      }
      mat-card-content { padding: 0 !important; }
    }
    @keyframes pulse-calendar-border {
      0%, 100% { box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.15); }
      50% { box-shadow: 0 0 0 6px rgba(220, 38, 38, 0.08); }
    }

    .calendar-toolbar {
      display: flex; justify-content: space-between; align-items: center;
      padding: 0.95rem 1.2rem; flex-wrap: wrap; gap: 0.75rem;
      border-bottom: 1px solid #e2e8f0;
      background: rgba(248, 250, 252, 0.85);
    }
    .calendar-toolbar-left { display: flex; align-items: center; gap: 0.75rem; }
    .calendar-toolbar-right { display: flex; gap: 0.5rem; }
    .period-label {
      font-size: 1.12rem; font-weight: 800; color: #0f172a;
      margin: 0; min-width: 210px; text-align: center; text-transform: capitalize;
      letter-spacing: 0.01em;
    }
    .today-btn { text-transform: none !important; border-radius: 10px; }

    /* Month */
    .month-view { padding: 1rem 1.1rem 1.15rem; }
    .day-headers {
      display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; margin-bottom: 0.65rem;
      span { text-align: center; font-size: 0.7rem; font-weight: 700; color: #64748b; text-transform: uppercase; padding: 0.4rem 0; letter-spacing: 0.03em; }
    }
    .calendar-week { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; min-height: 122px; margin-bottom: 0.5rem; }
    .calendar-day {
      border: 1px solid #eef2f7; border-radius: 12px; padding: 0.55rem; min-height: 122px;
      transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
      background: #ffffff;
      &:hover { background: #fbfdff; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(15, 23, 42, 0.08); }
      &.other-month { opacity: 0.42; }
      &.today { background: #eff6ff; border-color: #bfdbfe; }
    }
    .day-number {
      display: block; font-size: 0.77rem; font-weight: 700; color: #334155;
      padding: 0.125rem 0.25rem; text-align: right;
      .today & { color: #ea3f48; font-weight: 800; }
    }
    .day-items { display: flex; flex-direction: column; gap: 4px; margin-top: 6px; }
    .day-item-badge {
      font-size: 0.68rem; font-weight: 700; color: color-mix(in srgb, var(--tag-color, #6366f1) 70%, #0f172a);
      padding: 3px 8px;
      border-radius: 999px;
      border: 1px solid color-mix(in srgb, var(--tag-color, #6366f1) 25%, #e2e8f0);
      background: color-mix(in srgb, var(--tag-color, #6366f1) 12%, #ffffff);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease;
      &:hover { transform: translateY(-1px); box-shadow: 0 6px 14px rgba(15, 23, 42, 0.08); }
    }
    .more-items { font-size: 0.63rem; color: #64748b; padding: 0 4px; font-weight: 700; }

    /* Week */
    .week-view { display: flex; flex-direction: column; padding: 1rem 1.1rem 1.15rem; }
    .week-header-row { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; margin-bottom: 0.65rem; }
    .week-day-header { text-align: center; padding: 0.65rem; border-radius: 10px; background: #f8fafc; border: 1px solid #eef2f7; &.today { background: #e0ecff; color: #1e3a8a; border-color: #bfdbfe; } }
    .wdh-name { display: block; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: #64748b; .today & { color: white; } }
    .wdh-num { display: block; font-size: 1.05rem; font-weight: 900; color: #0f172a; .today & { color: white; } }
    .week-day-column { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; min-height: 230px; }
    .empty-day { text-align: center; color: #cbd5e1; font-size: 1.5rem; padding: 2rem 0; }
    .week-item-block {
      padding: 0.62rem 0.7rem; border-radius: 10px; border-left: 3px solid;
      background: #ffffff; box-shadow: 0 6px 14px rgba(15, 23, 42, 0.07); cursor: grab;
      border: 1px solid #eef2f7;
      transition: box-shadow 0.2s ease, transform 0.2s ease;
      &:hover { box-shadow: 0 12px 24px rgba(15, 23, 42, 0.1); transform: translateY(-2px); }
      &:active { cursor: grabbing; }
      &.critical { border-left-color: #dc2626 !important; background: #fff7f7; }
      &.overdue { border-left-color: #f59e0b !important; background: #fffdf5; }
    }
    .cdk-drag-preview {
      border-radius: 6px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      background: white;
    }
    .cdk-drag-placeholder {
      opacity: 0.4;
    }
    .cdk-drop-list-dragging .week-item-block:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
    .week-day-column {
      &.cdk-drop-list-dragging {
        background: rgba(99, 102, 241, 0.04);
        border-radius: 8px;
      }
      &.cdk-drop-list-receiving {
        background: rgba(20, 184, 166, 0.06);
        border-radius: 8px;
      }
    }
    .wi-header { display: flex; align-items: center; gap: 0.375rem; margin-bottom: 0.125rem; }
    .wi-icon { font-size: 17px !important; width: 17px !important; height: 17px !important; }
    .wi-time { font-size: 0.71rem; font-weight: 700; color: #64748b; }
    .wi-priority { font-size: 0.71rem; }
    .wi-title { font-size: 0.82rem; font-weight: 800; color: #0f172a; line-height: 1.3; }
    .wi-desc { font-size: 0.72rem; color: #64748b; margin-top: 0.15rem; line-height: 1.32; }

    @media (max-width: 980px) {
      .calendar-toolbar { padding: 0.75rem 0.85rem; }
      .period-label { min-width: unset; font-size: 1rem; }
      .calendar-toolbar-left { width: 100%; flex-wrap: wrap; }
      .calendar-toolbar-right { width: 100%; }
      .calendar-toolbar-right button { flex: 1; }
      .calendar-week { min-height: 94px; }
      .calendar-day { min-height: 94px; }
      .day-item-badge { font-size: 0.62rem; }
      .week-day-column { min-height: 170px; }
    }
  `],
})
export class CalendarViewComponent {
  @Input() showToolbar = true;
  @Input() view: 'month' | 'week' = 'month';
  @Input() monthGrid: CalendarSlot[][] = [];
  @Input() weekGrid: WeekSlot[] = [];
  @Input() periodLabel = '';
  @Input() hasCriticalAlert = false;

  @Output() viewChange = new EventEmitter<'month' | 'week'>();
  @Output() navigate = new EventEmitter<number>();
  @Output() today = new EventEmitter<void>();
  @Output() add = new EventEmitter<void>();
  @Output() openItem = new EventEmitter<AgendaItem>();
  @Output() itemDropped = new EventEmitter<{ item: AgendaItem; newDate: Date }>();

  /** Handles drag & drop rescheduling in week view */
  onItemDrop(event: CdkDragDrop<number, any, AgendaItem>): void {
    const dayIndex = event.container.data;
    const targetDay = this.weekGrid[dayIndex];
    if (!targetDay) return;
    const item = event.item.data;
    // Preserve original time, just change the date
    const newDate = new Date(targetDay.date);
    newDate.setHours(item.startDate.getHours(), item.startDate.getMinutes(), item.startDate.getSeconds());
    this.itemDropped.emit({ item, newDate });
  }

  readonly typeIcon = typeIcon;
  readonly typeColor = typeColor;
  readonly formatTime = formatTime;
  readonly priorityLabel = priorityLabel;
  readonly isCritical = isCriticalFn;
  readonly isOverdue = isOverdueFn;
}
