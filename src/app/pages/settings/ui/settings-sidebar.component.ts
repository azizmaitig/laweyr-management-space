import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SettingsCategory = {
  id: 'appearance' | 'notifications' | 'preferences' | 'team' | 'system';
  label: string;
  desc: string;
  icon: string;
};

@Component({
  selector: 'app-settings-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="sb" aria-label="Settings categories">
      @for (it of items(); track it.id) {
        <button
          type="button"
          class="sb__item"
          [class.is-active]="it.id === selectedId()"
          (click)="selectId.emit(it.id)"
        >
          <div class="sb__icon">{{ it.icon }}</div>
          <div class="sb__text">
            <div class="sb__label">{{ it.label }}</div>
            <div class="sb__desc">{{ it.desc }}</div>
          </div>
          <div class="sb__chev">›</div>
        </button>
      }
    </nav>
  `,
  styles: [`
    .sb {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .sb__item {
      width: 100%;
      display: grid;
      grid-template-columns: 34px minmax(0, 1fr) 18px;
      align-items: center;
      gap: 12px;
      padding: 12px 12px;
      border-radius: 16px;
      border: 1px solid transparent;
      background: transparent;
      cursor: pointer;
      text-align: left;
      transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
      color: var(--text);
    }
    .sb__item:hover {
      transform: translateY(-1px);
      background: color-mix(in oklab, var(--card) 88%, var(--bg));
      border-color: color-mix(in oklab, var(--text) 12%, transparent);
      box-shadow: 0 14px 26px rgba(0, 0, 0, 0.08);
    }
    .sb__item.is-active {
      background: color-mix(in oklab, var(--card) 92%, var(--bg));
      border-color: color-mix(in oklab, var(--clr-primary) 55%, transparent);
      box-shadow: 0 18px 34px color-mix(in oklab, var(--clr-primary) 14%, transparent);
    }
    .sb__icon {
      width: 34px;
      height: 34px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: color-mix(in oklab, var(--card) 92%, var(--bg));
      border: 1px solid color-mix(in oklab, var(--text) 10%, transparent);
    }
    .sb__label {
      font-weight: 900;
      font-size: 0.9rem;
      letter-spacing: -0.01em;
    }
    .sb__desc {
      margin-top: 4px;
      font-size: 0.76rem;
      color: color-mix(in oklab, var(--text) 60%, transparent);
      line-height: 1.25;
    }
    .sb__chev {
      justify-self: end;
      font-size: 1.1rem;
      opacity: 0.55;
      transition: transform 0.2s ease, opacity 0.2s ease;
    }
    .sb__item:hover .sb__chev {
      transform: translateX(2px);
      opacity: 0.8;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsSidebarComponent {
  items = input<SettingsCategory[]>([]);
  selectedId = input<SettingsCategory['id']>('appearance');
  selectId = output<SettingsCategory['id']>();
}

