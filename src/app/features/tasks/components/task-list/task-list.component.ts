import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../../../core/models';
import { TaskItemComponent } from '../task-item/task-item.component';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, TaskItemComponent],
  template: `
    <div class="task-list">
      @if (tasks().length === 0) {
        <div class="task-list__empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <p>لا توجد مهام لهذا الملف</p>
          <button class="task-list__empty-btn" (click)="createRequested.emit()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            إضافة مهمة
          </button>
        </div>
      } @else {
        @for (task of tasks(); track task.id) {
          <app-task-item
            [task]="task"
            (completeRequested)="completeRequested.emit($event)"
            (updateRequested)="updateRequested.emit($event)"
            (deleteRequested)="deleteRequested.emit($event)">
          </app-task-item>
        }
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .task-list { display: flex; flex-direction: column; gap: var(--space-2); }
    .task-list__empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--space-16) var(--space-8); color: var(--clr-text-muted); text-align: center; }
    .task-list__empty svg { width: 48px; height: 48px; margin-bottom: var(--space-4); opacity: .35; }
    .task-list__empty p { font-size: var(--text-md); margin: 0 0 var(--space-4); }
    .task-list__empty-btn { display: inline-flex; align-items: center; gap: var(--space-2); padding: var(--space-3) var(--space-6); border: 1px solid var(--clr-border); border-radius: var(--radius-sm); background: var(--clr-white); color: var(--clr-text-secondary); font-size: var(--text-base); font-weight: var(--font-semibold); cursor: pointer; transition: all var(--transition); }
    .task-list__empty-btn:hover { border-color: var(--clr-primary); color: var(--clr-primary); }
    .task-list__empty-btn svg { width: 14px; height: 14px; }

    /* Tablet */
    @media (max-width: 1023px) {
      .task-list__empty { padding: var(--space-12) var(--space-6); }
    }

    /* Mobile */
    @media (max-width: 767px) {
      .task-list__empty { padding: var(--space-12) var(--space-4); }
      .task-list__empty svg { width: 40px; height: 40px; }
      .task-list__empty p { font-size: var(--text-base); }
      .task-list__empty-btn { padding: var(--space-2) var(--space-4); font-size: var(--text-sm); }
    }
  `],
})
export class TaskListComponent {
  tasks = input.required<Task[]>();
  createRequested = output<void>();
  updateRequested = output<Task>();
  completeRequested = output<Task>();
  deleteRequested = output<number>();
}
