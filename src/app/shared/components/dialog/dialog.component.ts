import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (open()) {
      <div class="app-dialog__backdrop" (click)="closed.emit()">
        <div class="app-dialog" [class.app-dialog--lg]="size() === 'lg'" (click)="$event.stopPropagation()">
          <div class="app-dialog__header">
            <h3 class="app-dialog__title">{{ title() }}</h3>
            <button class="app-dialog__close" (click)="closed.emit()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="app-dialog__body">
            <ng-content></ng-content>
          </div>
          @if (showFooter()) {
            <div class="app-dialog__footer">
              <ng-content select="[appDialogFooter]"></ng-content>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .app-dialog__backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: var(--space-8); animation: app-dialog-fade-in 0.2s ease; }
    @keyframes app-dialog-fade-in { from { opacity: 0; } to { opacity: 1; } }
    .app-dialog { background: var(--clr-white); border-radius: var(--radius-2xl); box-shadow: var(--shadow-xl); width: 100%; max-width: 480px; max-height: 90vh; display: flex; flex-direction: column; animation: app-dialog-slide-in 0.2s ease; }
    @keyframes app-dialog-slide-in { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .app-dialog--lg { max-width: 640px; }
    .app-dialog__header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-6) var(--space-6) var(--space-4); border-bottom: 1px solid var(--clr-border); }
    .app-dialog__title { font-size: var(--text-xl); font-weight: var(--font-bold); color: var(--clr-secondary); margin: 0; }
    .app-dialog__close { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border: none; border-radius: var(--radius-sm); background: transparent; color: var(--clr-text-muted); cursor: pointer; transition: all var(--transition-fast); }
    .app-dialog__close:hover { background: var(--clr-secondary-light); color: var(--clr-secondary); }
    .app-dialog__close svg { width: 16px; height: 16px; }
    .app-dialog__body { padding: var(--space-6); overflow-y: auto; flex: 1; }
    .app-dialog__footer { display: flex; justify-content: flex-end; gap: var(--space-3); padding: var(--space-4) var(--space-6); border-top: 1px solid var(--clr-border); }

    /* Mobile */
    @media (max-width: 767px) {
      .app-dialog__backdrop { padding: var(--space-4); }
      .app-dialog { max-width: 100%; border-radius: var(--radius-xl); }
      .app-dialog__header { padding: var(--space-4) var(--space-4) var(--space-3); }
      .app-dialog__title { font-size: var(--text-lg); }
      .app-dialog__body { padding: var(--space-4); }
      .app-dialog__footer { padding: var(--space-3) var(--space-4); }
    }
  `],
})
export class DialogComponent {
  open = input(false);
  title = input.required<string>();
  size = input<'md' | 'lg'>('md');
  showFooter = input(true);
  closed = output<void>();
}
