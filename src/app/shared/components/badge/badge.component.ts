import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="app-badge" [class]="'app-badge--' + variant()">
      @if (icon()) {
        <ng-content select="[appBadgeIcon]"></ng-content>
      }
      <ng-content></ng-content>
    </span>
  `,
  styles: [`
    :host { display: inline-block; }
    .app-badge {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      font-size: var(--text-xs);
      font-weight: var(--font-bold);
      white-space: nowrap;
      line-height: 1;
    }
    .app-badge ::ng-deep [appBadgeIcon] svg {
      width: 10px;
      height: 10px;
    }
    .app-badge--success { background: var(--clr-accent-green-light); color: var(--clr-accent-green); }
    .app-badge--warning { background: var(--clr-accent-amber-light); color: var(--clr-accent-amber); }
    .app-badge--error { background: var(--clr-primary-light); color: var(--clr-error); }
    .app-badge--info { background: var(--clr-accent-blue-light); color: var(--clr-accent-blue); }
    .app-badge--neutral { background: var(--clr-secondary-light); color: var(--clr-text-muted); }
    .app-badge--primary { background: var(--clr-primary-light); color: var(--clr-primary); }
  `],
})
export class BadgeComponent {
  variant = input<BadgeVariant>('neutral');
  icon = input(false);
}
