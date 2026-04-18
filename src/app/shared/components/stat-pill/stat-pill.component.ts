import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-pill',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stat-pill" [class]="'stat-pill--' + color()">
      <div class="stat-pill__icon" [innerHTML]="icon()"></div>
      <div class="stat-pill__info">
        <span class="stat-pill__value">{{ value() }}</span>
        <span class="stat-pill__label">{{ label() }}</span>
      </div>
    </div>
  `,
  styles: [`
    .stat-pill { background: white; border: 1px solid #e8eaed; border-radius: 12px; padding: .75rem 1rem; display: flex; align-items: center; gap: .75rem; box-shadow: 0 1px 3px rgba(0,0,0,.04); transition: all .2s; }
    .stat-pill:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,.06); }
    .stat-pill__icon { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .stat-pill__icon svg { width: 20px; height: 20px; }
    .stat-pill--teal .stat-pill__icon { background: #ccfbf1; color: #0d9488; }
    .stat-pill--amber .stat-pill__icon { background: #fef3c7; color: #f59e0b; }
    .stat-pill--red .stat-pill__icon { background: #fef2f2; color: #ea3f48; }
    .stat-pill--blue .stat-pill__icon { background: #eff6ff; color: #3b82f6; }
    .stat-pill--gray .stat-pill__icon { background: #f3f4f6; color: #6b7280; }
    .stat-pill--green .stat-pill__icon { background: #f0fdf4; color: #16a34a; }
    .stat-pill--navy .stat-pill__icon { background: #eff6ff; color: #0f2d5e; }
    .stat-pill__value { display: block; font-size: 1.25rem; font-weight: 800; line-height: 1; }
    .stat-pill__label { display: block; font-size: .7rem; color: #9ca3af; margin-top: .15rem; }
  `],
})
export class StatPillComponent {
  value = input.required<string | number>();
  label = input.required<string>();
  color = input<'teal' | 'amber' | 'red' | 'blue' | 'gray' | 'green' | 'navy'>('blue');
  icon = input<string>('');
}
