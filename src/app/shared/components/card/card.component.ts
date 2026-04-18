import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type CardVariant = 'default' | 'compact' | 'elevated' | 'interactive';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="app-card"
      [class.app-card--compact]="variant() === 'compact'"
      [class.app-card--elevated]="variant() === 'elevated'"
      [class.app-card--interactive]="variant() === 'interactive'">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .app-card {
      background: var(--clr-white);
      border: 1px solid var(--clr-border);
      border-radius: var(--radius-xl);
      padding: var(--space-6);
      box-shadow: var(--shadow-sm);
      transition: all var(--transition);
    }
    .app-card:hover {
      box-shadow: var(--shadow-md);
    }
    .app-card--compact {
      padding: var(--space-4);
      border-radius: var(--radius-lg);
    }
    .app-card--elevated {
      box-shadow: var(--shadow-md);
      border-color: var(--clr-border-light);
    }
    .app-card--elevated:hover {
      box-shadow: var(--shadow-lg);
    }
    .app-card--interactive {
      cursor: pointer;
    }
    .app-card--interactive:hover {
      border-color: var(--clr-primary);
      box-shadow: var(--shadow-md);
    }
  `],
})
export class CardComponent {
  variant = input<CardVariant>('default');
}
