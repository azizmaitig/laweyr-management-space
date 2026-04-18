import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      class="app-button"
      [class.app-button--primary]="variant() === 'primary'"
      [class.app-button--secondary]="variant() === 'secondary'"
      [class.app-button--outline]="variant() === 'outline'"
      [class.app-button--ghost]="variant() === 'ghost'"
      [class.app-button--danger]="variant() === 'danger'"
      [class.app-button--sm]="size() === 'sm'"
      [class.app-button--lg]="size() === 'lg'"
      [disabled]="disabled()"
      (click)="clicked.emit($event)">
      @if (icon()) {
        <span class="app-button__icon">
          <ng-content select="[appButtonIcon]"></ng-content>
        </span>
      }
      <span class="app-button__label">
        <ng-content></ng-content>
      </span>
    </button>
  `,
  styles: [`
    :host { display: inline-block; }
    .app-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      border: none;
      border-radius: var(--radius-sm);
      font-family: var(--font-family-arabic);
      font-weight: var(--font-semibold);
      cursor: pointer;
      transition: all var(--transition);
      white-space: nowrap;
      line-height: 1;
    }

    .app-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Variants */
    .app-button--primary {
      background: var(--clr-primary);
      color: white;
      padding: var(--space-3) var(--space-6);
      font-size: var(--text-base);
    }
    .app-button--primary:hover:not(:disabled) {
      background: var(--clr-primary-hover);
      box-shadow: var(--shadow-sm);
    }
    .app-button--primary:active:not(:disabled) {
      background: var(--clr-primary-dark);
    }

    .app-button--secondary {
      background: var(--clr-white);
      border: 1.5px solid var(--clr-border);
      color: var(--clr-text-secondary);
      padding: var(--space-3) var(--space-6);
      font-size: var(--text-base);
    }
    .app-button--secondary:hover:not(:disabled) {
      border-color: var(--clr-secondary);
      color: var(--clr-secondary);
      background: var(--clr-secondary-light);
    }

    .app-button--outline {
      background: transparent;
      border: 1.5px solid var(--clr-border);
      color: var(--clr-text-secondary);
      padding: var(--space-3) var(--space-6);
      font-size: var(--text-base);
    }
    .app-button--outline:hover:not(:disabled) {
      border-color: var(--clr-secondary);
      color: var(--clr-secondary);
    }

    .app-button--ghost {
      background: transparent;
      color: var(--clr-text-secondary);
      padding: var(--space-2) var(--space-4);
      font-size: var(--text-base);
    }
    .app-button--ghost:hover:not(:disabled) {
      background: var(--clr-secondary-light);
    }

    .app-button--danger {
      background: var(--clr-primary-light);
      color: var(--clr-error);
      padding: var(--space-3) var(--space-6);
      font-size: var(--text-base);
    }
    .app-button--danger:hover:not(:disabled) {
      background: var(--clr-error);
      color: white;
    }

    /* Sizes */
    .app-button--sm {
      padding: var(--space-2) var(--space-4);
      font-size: var(--text-sm);
    }

    .app-button--lg {
      padding: var(--space-4) var(--space-8);
      font-size: var(--text-lg);
    }

    /* Icon */
    .app-button__icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .app-button__icon ::ng-deep svg {
      width: 14px;
      height: 14px;
    }
    .app-button--sm .app-button__icon ::ng-deep svg {
      width: 12px;
      height: 12px;
    }
    .app-button--lg .app-button__icon ::ng-deep svg {
      width: 16px;
      height: 16px;
    }

    .app-button__label {
      display: inline;
    }
  `],
})
export class ButtonComponent {
  variant = input<ButtonVariant>('primary');
  size = input<ButtonSize>('md');
  disabled = input(false);
  icon = input(false);
  clicked = output<MouseEvent>();
}
