import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ColorSwatch = { id: string; color: string };

@Component({
  selector: 'app-color-picker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cp" role="listbox" aria-label="Primary color">
      @for (s of swatches(); track s.id) {
        <button
          type="button"
          class="cp__sw"
          [class.is-active]="normalize(selectedColor()) === normalize(s.color)"
          [style.--sw]="s.color"
          (click)="selectColor.emit(s.color)"
          [attr.aria-selected]="normalize(selectedColor()) === normalize(s.color)"
        ></button>
      }
    </div>
  `,
  styles: [`
    .cp {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    .cp__sw {
      width: 18px;
      height: 18px;
      border-radius: 999px;
      border: 2px solid color-mix(in oklab, var(--text) 12%, transparent);
      background: var(--sw);
      cursor: pointer;
      position: relative;
      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
    }
    .cp__sw:hover {
      transform: translateY(-1px) scale(1.06);
      box-shadow: 0 14px 24px rgba(0, 0, 0, 0.14);
      border-color: color-mix(in oklab, var(--text) 20%, transparent);
    }
    .cp__sw.is-active {
      border-color: color-mix(in oklab, var(--clr-primary) 55%, #000);
      box-shadow: 0 16px 30px color-mix(in oklab, var(--clr-primary) 20%, transparent);
      transform: translateY(-1px) scale(1.08);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorPickerComponent {
  swatches = input<ColorSwatch[]>([]);
  selectedColor = input<string>('');
  selectColor = output<string>();

  normalize(v: string): string {
    return (v ?? '').trim().toLowerCase();
  }
}

