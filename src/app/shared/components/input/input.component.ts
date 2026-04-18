import { Component, input, output, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="app-input">
      @if (label()) {
        <label class="app-input__label">{{ label() }}</label>
      }
      <div class="app-input__wrapper">
        @if (icon()) {
          <span class="app-input__icon">
            <ng-content select="[appInputIcon]"></ng-content>
          </span>
        }
        <input
          [type]="type()"
          [placeholder]="placeholder()"
          [disabled]="disabled()"
          [value]="value"
          (input)="onInput($event)"
          (blur)="onBlur()"
          class="app-input__field"
          [class.app-input__field--has-icon]="icon()">
      </div>
      @if (error()) {
        <span class="app-input__error">{{ error() }}</span>
      }
      @if (hint() && !error()) {
        <span class="app-input__hint">{{ hint() }}</span>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .app-input { display: flex; flex-direction: column; gap: var(--space-1); }
    .app-input__label { font-size: var(--text-sm); font-weight: var(--font-semibold); color: var(--clr-text-muted); }
    .app-input__wrapper { position: relative; }
    .app-input__icon { position: absolute; right: var(--space-3); top: 50%; transform: translateY(-50%); color: var(--clr-text-muted); pointer-events: none; display: flex; align-items: center; }
    .app-input__icon ::ng-deep svg { width: 16px; height: 16px; }
    .app-input__field { width: 100%; padding: var(--space-3) var(--space-4); border: 1.5px solid var(--clr-border); border-radius: var(--radius-md); font-family: var(--font-family-arabic); font-size: var(--text-lg); color: var(--clr-secondary); background: var(--clr-secondary-light); outline: none; transition: all var(--transition-fast); }
    .app-input__field::placeholder { color: var(--clr-text-muted); }
    .app-input__field:focus { border-color: var(--clr-primary); background: var(--clr-white); }
    .app-input__field:disabled { opacity: 0.6; cursor: not-allowed; }
    .app-input__field--has-icon { padding-right: 2.5rem; }
    .app-input__error { font-size: var(--text-sm); color: var(--clr-error); }
    .app-input__hint { font-size: var(--text-sm); color: var(--clr-text-muted); }
  `],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => InputComponent),
    multi: true,
  }],
})
export class InputComponent implements ControlValueAccessor {
  type = input<InputType>('text');
  label = input<string>('');
  placeholder = input<string>('');
  error = input<string>('');
  hint = input<string>('');
  icon = input(false);
  disabled = input(false);

  value: string = '';
  onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: string): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // Handled via input binding
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.value = value;
    this.onChange(value);
  }

  onBlur(): void {
    this.onTouched();
  }
}
