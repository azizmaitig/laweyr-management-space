import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="app-empty-state">
      <div class="app-empty-state__icon">
        <ng-content select="[appEmptyIcon]"></ng-content>
      </div>
      <p class="app-empty-state__message">{{ message() }}</p>
      @if (actionLabel()) {
        <button class="app-empty-state__action" (click)="actionClicked.emit()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {{ actionLabel() }}
        </button>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .app-empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--space-16) var(--space-8); color: var(--clr-text-muted); text-align: center; }
    .app-empty-state__icon { margin-bottom: var(--space-4); }
    .app-empty-state__icon ::ng-deep svg { width: 48px; height: 48px; opacity: 0.35; }
    .app-empty-state__message { font-size: var(--text-md); margin: 0 0 var(--space-4); }
    .app-empty-state__action { display: inline-flex; align-items: center; gap: var(--space-2); padding: var(--space-3) var(--space-6); border: 1px solid var(--clr-border); border-radius: var(--radius-sm); background: var(--clr-white); color: var(--clr-text-secondary); font-size: var(--text-base); font-weight: var(--font-semibold); cursor: pointer; transition: all var(--transition); }
    .app-empty-state__action:hover { border-color: var(--clr-primary); color: var(--clr-primary); }
    .app-empty-state__action svg { width: 14px; height: 14px; }

    /* Mobile */
    @media (max-width: 767px) {
      .app-empty-state { padding: var(--space-12) var(--space-4); }
      .app-empty-state__icon ::ng-deep svg { width: 40px; height: 40px; }
      .app-empty-state__message { font-size: var(--text-base); }
      .app-empty-state__action { padding: var(--space-2) var(--space-4); font-size: var(--text-sm); }
    }
  `],
})
export class EmptyStateComponent {
  message = input.required<string>();
  actionLabel = input<string>('');
  actionClicked = output<void>();
}
