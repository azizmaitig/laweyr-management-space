import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-settings-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="sc">
      <header class="sc__head">
        <div class="sc__title">{{ title() }}</div>
        @if (subtitle()) {
          <div class="sc__subtitle">{{ subtitle() }}</div>
        }
      </header>
      <div class="sc__body">
        <ng-content></ng-content>
      </div>
    </section>
  `,
  styles: [`
    .sc {
      background: var(--card);
      border-radius: 18px;
      padding: 18px;
      box-shadow: 0 14px 34px rgba(0, 0, 0, 0.08);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .sc:hover {
      transform: translateY(-1px);
      box-shadow: 0 18px 42px rgba(0, 0, 0, 0.10);
    }
    .sc__head {
      margin-bottom: 14px;
    }
    .sc__title {
      font-size: 0.95rem;
      font-weight: 950;
      color: var(--text);
      letter-spacing: -0.02em;
    }
    .sc__subtitle {
      margin-top: 6px;
      font-size: 0.78rem;
      color: color-mix(in oklab, var(--text) 60%, transparent);
      line-height: 1.35;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsCardComponent {
  title = input<string>('');
  subtitle = input<string>('');
}

