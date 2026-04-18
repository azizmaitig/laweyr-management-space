import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="app-spinner" [class.app-spinner--inline]="inline()">
      <svg class="app-spinner__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" stroke-dasharray="31.4" stroke-dashoffset="10"/>
      </svg>
      @if (label()) {
        <span class="app-spinner__label">{{ label() }}</span>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .app-spinner { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-3); padding: var(--space-12); color: var(--clr-text-muted); }
    .app-spinner--inline { display: inline-flex; padding: var(--space-2); gap: var(--space-2); flex-direction: row; }
    .app-spinner__icon { width: 24px; height: 24px; animation: app-spinner-spin 0.8s linear infinite; }
    .app-spinner--inline .app-spinner__icon { width: 16px; height: 16px; }
    @keyframes app-spinner-spin { to { transform: rotate(360deg); } }
    .app-spinner__label { font-size: var(--text-sm); }
    .app-spinner--inline .app-spinner__label { font-size: var(--text-xs); }
  `],
})
export class SpinnerComponent {
  label = input<string>('');
  inline = input(false);
}
