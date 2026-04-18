import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toggle-switch',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      type="button"
      class="tg"
      [class.tg--on]="checked()"
      [attr.aria-pressed]="checked()"
      (click)="checkedChange.emit(!checked())"
    >
      <span class="tg__icon">{{ checked() ? iconOn() : iconOff() }}</span>
      <span class="tg__track">
        <span class="tg__knob"></span>
      </span>
      @if (label()) {
        <span class="tg__label">{{ label() }}</span>
      }
    </button>
  `,
  styles: [`
    .tg {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      height: 40px;
      padding: 0 12px;
      border-radius: 999px;
      border: 1px solid color-mix(in oklab, var(--text) 12%, transparent);
      background: color-mix(in oklab, var(--card) 92%, var(--bg));
      color: var(--text);
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, border-color 0.2s ease;
    }
    .tg:hover {
      transform: translateY(-1px);
      box-shadow: 0 16px 30px rgba(0, 0, 0, 0.08);
      border-color: color-mix(in oklab, var(--text) 18%, transparent);
    }
    .tg__icon {
      width: 20px;
      text-align: center;
      font-size: 0.95rem;
      opacity: 0.9;
    }
    .tg__track {
      position: relative;
      width: 44px;
      height: 24px;
      border-radius: 999px;
      background: color-mix(in oklab, var(--bg) 85%, var(--card));
      border: 1px solid color-mix(in oklab, var(--text) 12%, transparent);
      box-shadow: inset 0 1px 2px rgba(0,0,0,0.10);
    }
    .tg__knob {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 20px;
      height: 20px;
      border-radius: 999px;
      background: var(--card);
      box-shadow: 0 10px 18px rgba(0, 0, 0, 0.18);
      transition: transform 0.2s ease;
    }
    .tg--on .tg__track {
      background: color-mix(in oklab, var(--clr-primary) 70%, #000);
      border-color: color-mix(in oklab, var(--clr-primary) 50%, transparent);
    }
    .tg--on .tg__knob {
      transform: translateX(20px);
    }
    .tg__label {
      font-size: 0.82rem;
      font-weight: 900;
      color: color-mix(in oklab, var(--text) 82%, transparent);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleSwitchComponent {
  checked = input<boolean>(false);
  label = input<string>('');
  iconOn = input<string>('✓');
  iconOff = input<string>('—');
  checkedChange = output<boolean>();
}

