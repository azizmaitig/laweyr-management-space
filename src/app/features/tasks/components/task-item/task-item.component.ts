import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../../../core/models';

@Component({
  selector: 'app-task-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="task-item" [class.task-item--done]="task().status === 'DONE'">
      <button class="task-item__checkbox" [class]="'task-item__checkbox--' + task().status" (click)="completeRequested.emit(task())" [attr.aria-label]="task().status === 'DONE' ? 'تم إكمال المهمة' : 'تحديد المهمة كمكتملة'" [attr.aria-pressed]="task().status === 'DONE'">
        @if (task().status === 'DONE') {
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
        } @else {
          <span class="task-item__checkbox-empty"></span>
        }
      </button>
      <div class="task-item__content">
        <div class="task-item__head">
          <h4 [class.task-item__title--done]="task().status === 'DONE'">{{ task().title }}</h4>
          <span class="task-item__priority" [class]="'task-item__priority--' + task().priority">{{ priorityLabels[task().priority] }}</span>
        </div>
        @if (task().description) {
          <p class="task-item__desc">{{ task().description }}</p>
        }
        <div class="task-item__meta">
          <span class="task-item__status" [class]="'task-item__status--' + task().status">{{ statusLabels[task().status] }}</span>
          @if (task().dueDate) {
            <span class="task-item__due" [class.task-item__due--overdue]="task().dueDate! < todayStr && task().status !== 'DONE'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {{ task().dueDate }}
            </span>
          }
        </div>
      </div>
      <div class="task-item__actions">
        <button class="task-item__action" (click)="updateRequested.emit(task())" [attr.aria-label]="'تعديل المهمة: ' + task().title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="task-item__action task-item__action--delete" (click)="deleteRequested.emit(task().id)" [attr.aria-label]="'حذف المهمة: ' + task().title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .task-item { display: flex; flex-wrap: wrap; align-items: flex-start; gap: var(--space-3); padding: var(--space-4) var(--space-5); border: 1px solid var(--clr-border); border-radius: var(--radius-lg); background: var(--clr-white); transition: all var(--transition); }
    .task-item:hover { box-shadow: var(--shadow-sm); }
    .task-item--done { opacity: .6; }
    .task-item--done .task-item__title--done { text-decoration: line-through; color: var(--clr-text-muted); }
    .task-item__checkbox { width: 28px; height: 28px; border-radius: var(--radius-full); border: 2px solid var(--clr-border); background: transparent; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all var(--transition-fast); flex-shrink: 0; margin-top: 2px; }
    .task-item__checkbox:hover { border-color: var(--clr-accent-green); }
    .task-item__checkbox:focus-visible { outline: 2px solid var(--clr-primary); outline-offset: 2px; }
    .task-item__checkbox svg { width: 16px; height: 16px; color: var(--clr-accent-green); }
    .task-item__checkbox-empty { width: 12px; height: 12px; border-radius: var(--radius-full); }
    .task-item__checkbox--DONE { border-color: var(--clr-accent-green); background: var(--clr-accent-green); }
    .task-item__checkbox--DONE svg { color: var(--clr-white); }
    .task-item__checkbox--IN_PROGRESS { border-color: var(--clr-accent-amber); }
    .task-item__content { flex: 1; min-width: 0; }
    .task-item__head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: var(--space-2); margin-bottom: var(--space-1); }
    .task-item__head h4 { font-size: var(--text-md); font-weight: var(--font-semibold); color: var(--clr-secondary); margin: 0; line-height: var(--leading-tight); }
    .task-item__priority { font-size: var(--text-xs); font-weight: var(--font-bold); padding: var(--space-1) var(--space-2); border-radius: var(--radius-sm); white-space: nowrap; }
    .task-item__priority--HIGH { background: var(--clr-primary-light); color: var(--clr-error); }
    .task-item__priority--MEDIUM { background: var(--clr-accent-amber-light); color: var(--clr-accent-amber); }
    .task-item__priority--LOW { background: var(--clr-accent-green-light); color: var(--clr-accent-green); }
    .task-item__desc { font-size: var(--text-sm); color: var(--clr-text-secondary); margin: 0 0 var(--space-2); line-height: var(--leading-normal); }
    .task-item__meta { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2); }
    .task-item__status { font-size: var(--text-xs); font-weight: var(--font-bold); padding: var(--space-1) var(--space-2); border-radius: var(--radius-sm); }
    .task-item__status--TODO { background: var(--clr-secondary-light); color: var(--clr-text-muted); }
    .task-item__status--IN_PROGRESS { background: var(--clr-accent-amber-light); color: var(--clr-accent-amber); }
    .task-item__status--DONE { background: var(--clr-accent-green-light); color: var(--clr-accent-green); }
    .task-item__due { display: inline-flex; align-items: center; gap: var(--space-1); font-size: var(--text-sm); color: var(--clr-text-muted); }
    .task-item__due svg { width: 12px; height: 12px; }
    .task-item__due--overdue { color: var(--clr-error); font-weight: var(--font-bold); }
    .task-item__actions { display: flex; gap: var(--space-1); flex-shrink: 0; }
    .task-item__action { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border: none; border-radius: var(--radius-sm); background: transparent; color: var(--clr-text-muted); cursor: pointer; transition: all var(--transition-fast); }
    .task-item__action:hover { background: var(--clr-secondary-light); color: var(--clr-secondary); }
    .task-item__action:focus-visible { outline: 2px solid var(--clr-primary); outline-offset: 2px; }
    .task-item__action--delete:hover { background: var(--clr-primary-light); color: var(--clr-error); }
    .task-item__action svg { width: 13px; height: 13px; }

    /* Tablet */
    @media (max-width: 1023px) {
      .task-item { padding: var(--space-3) var(--space-4); }
      .task-item__checkbox { width: 26px; height: 26px; }
      .task-item__checkbox svg { width: 14px; height: 14px; }
    }

    /* Mobile */
    @media (max-width: 767px) {
      .task-item { flex-direction: column; gap: var(--space-2); padding: var(--space-3) var(--space-4); }
      .task-item__checkbox { margin-top: 0; }
      .task-item__head { flex-direction: column; align-items: flex-start; gap: var(--space-1); }
      .task-item__head h4 { font-size: var(--text-base); }
      .task-item__meta { font-size: var(--text-xs); }
      .task-item__actions { align-self: flex-end; }
    }
  `],
})
export class TaskItemComponent {
  task = input.required<Task>();
  todayStr = new Date().toISOString().split('T')[0];
  priorityLabels: Record<string, string> = { HIGH: '🔴 عالي', MEDIUM: '🟡 متوسط', LOW: '🟢 منخفض' };
  statusLabels: Record<string, string> = { TODO: 'قيد الانتظار', IN_PROGRESS: 'قيد التنفيذ', DONE: 'مكتمل' };
  completeRequested = output<Task>();
  updateRequested = output<Task>();
  deleteRequested = output<number>();
}
