import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ThemeCard = {
  id: 'LIGHT' | 'DARK' | string;
  title: string;
  subtitle: string;
  preview: 'light' | 'dark' | 'blue' | 'graphite';
  enabled: boolean;
};

@Component({
  selector: 'app-theme-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ts">
      @for (t of themes(); track t.id) {
        <button
          type="button"
          class="ts__card"
          [class.is-active]="t.id === selected()"
          [class.is-disabled]="!t.enabled"
          [attr.aria-pressed]="t.id === selected()"
          [attr.aria-disabled]="!t.enabled"
          (click)="t.enabled && selectTheme.emit(t.id)"
        >
          <div class="ts__preview" [attr.data-preview]="t.preview">
            <div class="ts__mini ts__mini--top"></div>
            <div class="ts__mini ts__mini--mid"></div>
            <div class="ts__mini ts__mini--bot"></div>
          </div>
          <div class="ts__meta">
            <div class="ts__title">{{ t.title }}</div>
            <div class="ts__sub">{{ t.subtitle }}</div>
          </div>
        </button>
      }
    </div>
  `,
  styles: [`
    .ts {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }
    .ts__card {
      display: grid;
      grid-template-columns: 56px minmax(0, 1fr);
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 16px;
      border: 1px solid color-mix(in oklab, var(--text) 12%, transparent);
      background: color-mix(in oklab, var(--card) 92%, var(--bg));
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease;
      text-align: left;
    }
    .ts__card:hover {
      transform: translateY(-1px);
      box-shadow: 0 16px 30px rgba(0, 0, 0, 0.10);
      border-color: color-mix(in oklab, var(--text) 18%, transparent);
      background: color-mix(in oklab, var(--card) 86%, var(--bg));
    }
    .ts__card.is-active {
      border-color: color-mix(in oklab, var(--clr-primary) 60%, transparent);
      box-shadow: 0 20px 42px color-mix(in oklab, var(--clr-primary) 14%, transparent);
    }
    .ts__card.is-disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
    .ts__preview {
      height: 44px;
      border-radius: 14px;
      border: 1px solid color-mix(in oklab, var(--text) 12%, transparent);
      display: grid;
      gap: 6px;
      padding: 8px;
      box-shadow: inset 0 1px 2px rgba(0,0,0,0.08);
      background: #ffffff;
    }
    .ts__preview[data-preview='dark'] {
      background: #0f172a;
      border-color: rgba(226,232,240,0.14);
    }
    .ts__preview[data-preview='blue'] {
      background: #0b1220;
      border-color: rgba(56,189,248,0.22);
    }
    .ts__preview[data-preview='graphite'] {
      background: #111318;
      border-color: rgba(148,163,184,0.20);
    }
    .ts__mini {
      border-radius: 999px;
      height: 6px;
      background: rgba(30,41,59,0.14);
    }
    .ts__preview[data-preview='dark'] .ts__mini {
      background: rgba(226,232,240,0.16);
    }
    .ts__preview[data-preview='blue'] .ts__mini {
      background: rgba(56,189,248,0.18);
    }
    .ts__preview[data-preview='graphite'] .ts__mini {
      background: rgba(148,163,184,0.18);
    }
    .ts__title {
      font-size: 0.9rem;
      font-weight: 950;
      color: var(--text);
      letter-spacing: -0.02em;
    }
    .ts__sub {
      margin-top: 4px;
      font-size: 0.76rem;
      color: color-mix(in oklab, var(--text) 60%, transparent);
      line-height: 1.25;
    }
    @media (max-width: 560px) {
      .ts { grid-template-columns: 1fr; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeSelectorComponent {
  themes = input<ThemeCard[]>([]);
  selected = input<string>('LIGHT');
  selectTheme = output<string>();
}

