import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Communication } from '../../../../core/models';

@Component({
  selector: 'app-communication-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="comm-list">
      @if (communications().length === 0) {
        <div class="comm-list__empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <p>لا توجد تواصلات</p>
        </div>
      } @else {
        @for (comm of communications(); track comm.id) {
          <div class="comm-list__item">
            <div class="comm-list__icon" [class]="'comm-list__icon--' + comm.type" aria-hidden="true">
              @if (comm.type === 'CALL') {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              } @else if (comm.type === 'EMAIL') {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              } @else if (comm.type === 'MESSAGE') {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              } @else {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              }
            </div>
            <div class="comm-list__info">
              <div class="comm-list__head">
                <span class="comm-list__type">{{ getTypeLabel(comm.type) }}</span>
                <span class="comm-list__date">{{ comm.date }}</span>
              </div>
              @if (comm.note) {
                <p class="comm-list__note">{{ comm.note }}</p>
              }
            </div>
            <button class="comm-list__delete" (click)="deleteRequested.emit(comm.id)" [attr.aria-label]="'حذف التواصل'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .comm-list { display: flex; flex-direction: column; gap: var(--space-2); }
    .comm-list__empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--space-12) var(--space-6); color: var(--clr-text-muted); text-align: center; }
    .comm-list__empty svg { width: 40px; height: 40px; margin-bottom: var(--space-3); opacity: .35; }
    .comm-list__empty p { font-size: var(--text-sm); margin: 0; }
    .comm-list__item { display: flex; align-items: flex-start; gap: var(--space-3); padding: var(--space-4) var(--space-5); border: 1px solid var(--clr-border); border-radius: var(--radius-lg); background: var(--clr-white); transition: all var(--transition); }
    .comm-list__item:hover { box-shadow: var(--shadow-sm); }
    .comm-list__icon { width: 36px; height: 36px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .comm-list__icon svg { width: 18px; height: 18px; }
    .comm-list__icon--CALL { background: var(--clr-accent-green-light); color: var(--clr-accent-green); }
    .comm-list__icon--EMAIL { background: var(--clr-accent-blue-light); color: var(--clr-accent-blue); }
    .comm-list__icon--MESSAGE { background: var(--clr-accent-purple-light); color: var(--clr-accent-purple); }
    .comm-list__icon--APPOINTMENT { background: var(--clr-accent-amber-light); color: var(--clr-accent-amber); }
    .comm-list__info { flex: 1; min-width: 0; }
    .comm-list__head { display: flex; justify-content: space-between; align-items: center; gap: var(--space-2); margin-bottom: var(--space-1); }
    .comm-list__type { font-size: var(--text-sm); font-weight: var(--font-semibold); color: var(--clr-secondary); }
    .comm-list__date { font-size: var(--text-xs); color: var(--clr-text-muted); }
    .comm-list__note { font-size: var(--text-sm); color: var(--clr-text-secondary); margin: 0; line-height: var(--leading-normal); }
    .comm-list__delete { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border: none; border-radius: var(--radius-sm); background: transparent; color: var(--clr-text-muted); cursor: pointer; transition: all var(--transition-fast); flex-shrink: 0; }
    .comm-list__delete:hover { background: var(--clr-primary-light); color: var(--clr-error); }
    .comm-list__delete svg { width: 13px; height: 13px; }

    /* Mobile */
    @media (max-width: 767px) {
      .comm-list__item { flex-direction: column; gap: var(--space-2); padding: var(--space-3) var(--space-4); }
      .comm-list__delete { align-self: flex-end; }
    }
  `],
})
export class CommunicationListComponent {
  communications = input.required<Communication[]>();
  deleteRequested = output<number>();

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      CALL: '📞 مكالمة',
      EMAIL: '✉️ بريد إلكتروني',
      MESSAGE: '💬 رسالة',
      APPOINTMENT: '📅 موعد',
    };
    return labels[type] || type;
  }
}
