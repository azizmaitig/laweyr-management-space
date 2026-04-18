import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Note } from '../../../../core/models';

@Component({
  selector: 'app-note-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="note-list">
      @if (notes().length === 0) {
        <div class="note-list__empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <p>لا توجد ملاحظات لهذا الملف</p>
          <button class="note-list__empty-btn" (click)="createRequested.emit()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            إضافة ملاحظة
          </button>
        </div>
      } @else {
        @for (note of notes(); track note.id) {
          <div class="note-item">
            <div class="note-item__content">
              <div class="note-item__head">
                <h4>{{ note.title || 'ملاحظة بدون عنوان' }}</h4>
                <span class="note-item__date">{{ note.updatedAt ?? note.createdAt }}</span>
              </div>
              <div class="note-item__body" [innerHTML]="note.content"></div>
            </div>
            <div class="note-item__actions">
              <button class="note-item__action" (click)="openRequested.emit(note)" [attr.aria-label]="'فتح الملاحظة: ' + (note.title || 'بدون عنوان')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </button>
              <button class="note-item__action" (click)="updateRequested.emit(note)" [attr.aria-label]="'تعديل الملاحظة: ' + (note.title || 'بدون عنوان')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="note-item__action note-item__action--delete" (click)="deleteRequested.emit(note.id)" [attr.aria-label]="'حذف الملاحظة: ' + (note.title || 'بدون عنوان')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .note-list { display: flex; flex-direction: column; gap: var(--space-2); }
    .note-list__empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--space-16) var(--space-8); color: var(--clr-text-muted); text-align: center; }
    .note-list__empty svg { width: 48px; height: 48px; margin-bottom: var(--space-4); opacity: .35; }
    .note-list__empty p { font-size: var(--text-md); margin: 0 0 var(--space-4); }
    .note-list__empty-btn { display: inline-flex; align-items: center; gap: var(--space-2); padding: var(--space-3) var(--space-6); border: 1px solid var(--clr-border); border-radius: var(--radius-sm); background: var(--clr-white); color: var(--clr-text-secondary); font-size: var(--text-base); font-weight: var(--font-semibold); cursor: pointer; transition: all var(--transition); }
    .note-list__empty-btn:hover { border-color: var(--clr-primary); color: var(--clr-primary); }
    .note-list__empty-btn svg { width: 14px; height: 14px; }
    .note-item { display: flex; flex-wrap: wrap; align-items: flex-start; gap: var(--space-3); padding: var(--space-4) var(--space-5); border: 1px solid var(--clr-border); border-radius: var(--radius-lg); background: var(--clr-white); transition: all var(--transition); }
    .note-item:hover { box-shadow: var(--shadow-sm); }
    .note-item__content { flex: 1; min-width: 0; }
    .note-item__head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2); }
    .note-item__head h4 { font-size: var(--text-md); font-weight: var(--font-semibold); color: var(--clr-secondary); margin: 0; line-height: var(--leading-tight); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .note-item__date { font-size: var(--text-sm); color: var(--clr-text-muted); white-space: nowrap; }
    .note-item__body { font-size: var(--text-base); color: var(--clr-text-secondary); line-height: var(--leading-relaxed); max-height: 120px; overflow: hidden; }
    .note-item__body :first-child { margin-top: 0; }
    .note-item__body :last-child { margin-bottom: 0; }
    .note-item__body ul { padding-right: var(--space-6); margin: var(--space-1) 0; }
    .note-item__actions { display: flex; gap: var(--space-1); flex-shrink: 0; }
    .note-item__action { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border: none; border-radius: var(--radius-sm); background: transparent; color: var(--clr-text-muted); cursor: pointer; transition: all var(--transition-fast); }
    .note-item__action:hover { background: var(--clr-secondary-light); color: var(--clr-secondary); }
    .note-item__action:focus-visible { outline: 2px solid var(--clr-primary); outline-offset: 2px; }
    .note-item__action--delete:hover { background: var(--clr-primary-light); color: var(--clr-error); }
    .note-item__action svg { width: 13px; height: 13px; }

    /* Tablet */
    @media (max-width: 1023px) {
      .note-item { padding: var(--space-3) var(--space-4); }
    }

    /* Mobile */
    @media (max-width: 767px) {
      .note-item { flex-direction: column; gap: var(--space-2); padding: var(--space-3) var(--space-4); }
      .note-item__head { flex-direction: column; align-items: flex-start; gap: var(--space-1); }
      .note-item__head h4 { font-size: var(--text-base); }
      .note-item__date { font-size: var(--text-xs); }
      .note-item__body { font-size: var(--text-sm); max-height: 80px; }
      .note-item__actions { align-self: flex-end; }
      .note-list__empty { padding: var(--space-12) var(--space-4); }
      .note-list__empty svg { width: 40px; height: 40px; }
      .note-list__empty p { font-size: var(--text-base); }
      .note-list__empty-btn { padding: var(--space-2) var(--space-4); font-size: var(--text-sm); }
    }
  `],
})
export class NoteListComponent {
  notes = input.required<Note[]>();
  createRequested = output<void>();
  updateRequested = output<Note>();
  deleteRequested = output<number>();
  openRequested = output<Note>();
}
