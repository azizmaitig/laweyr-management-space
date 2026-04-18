import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="confirm-backdrop" (click)="cancel.emit()">
      <div class="confirm-dialog" (click)="$event.stopPropagation()">
        <h3>{{ title() }}</h3>
        <p>{{ message() }}</p>
        <div class="confirm-actions">
          <button class="btn btn--cancel" (click)="cancel.emit()">{{ cancelText() }}</button>
          <button class="btn btn--confirm" (click)="confirm.emit()">{{ confirmText() }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .confirm-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn .2s ease; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .confirm-dialog { background: white; border-radius: 12px; padding: 1.5rem; max-width: 400px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,.15); animation: slideUp .3s ease; }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .confirm-dialog h3 { font-size: 1rem; font-weight: 700; margin: 0 0 .5rem; }
    .confirm-dialog p { font-size: .85rem; color: #6b7280; margin: 0 0 1rem; }
    .confirm-actions { display: flex; justify-content: flex-end; gap: .5rem; }
    .btn { padding: .45rem .85rem; border-radius: 8px; font-family: inherit; font-size: .8rem; font-weight: 600; cursor: pointer; border: none; transition: all .2s; }
    .btn--cancel { background: #f3f4f6; color: #6b7280; }
    .btn--cancel:hover { background: #e5e7eb; }
    .btn--confirm { background: #ea3f48; color: white; }
    .btn--confirm:hover { background: #c8333d; }
  `],
})
export class ConfirmDialogComponent {
  title = input.required<string>();
  message = input.required<string>();
  confirmText = input<string>('تأكيد');
  cancelText = input<string>('إلغاء');
  confirm = output<void>();
  cancel = output<void>();
}
