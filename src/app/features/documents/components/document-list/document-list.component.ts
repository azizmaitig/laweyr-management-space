import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Document } from '../../../../core/models';
import { UploadDialogComponent } from '../upload-dialog/upload-dialog.component';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule, UploadDialogComponent],
  template: `
    <div class="doc-list">
      <!-- Header -->
      <header class="doc-list__header">
        <h3 class="doc-list__title">الوثائق</h3>
        <button class="doc-list__upload-btn" (click)="showUploadDialog.set(true)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          رفع وثيقة
        </button>
      </header>

      <!-- Document List -->
      @if (documents().length === 0) {
        <div class="doc-list__empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <p>لا توجد وثائق مرفوعة</p>
        </div>
      } @else {
        <div class="doc-list__grid">
          @for (doc of documents(); track doc.id) {
            <div class="doc-card">
              <div class="doc-card__icon" [class]="'doc-card__icon--' + getFileType(doc.name)">
                @if (getFileType(doc.name) === 'pdf') {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                } @else if (getFileType(doc.name) === 'word') {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                } @else {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                }
              </div>
              <div class="doc-card__info">
                <h4 class="doc-card__name">{{ doc.name }}</h4>
                <div class="doc-card__meta">
                  <span class="doc-card__type" [class]="'doc-card__type--' + doc.type">{{ getTypeLabel(doc.type) }}</span>
                  <span class="doc-card__date">{{ doc.createdAt }}</span>
                </div>
              </div>
              <div class="doc-card__actions">
                <button class="doc-card__action" (click)="openRequested.emit(doc)" aria-label="فتح {{ doc.name }}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </button>
                <button class="doc-card__action doc-card__action--delete" (click)="deleteRequested.emit(doc.id)" aria-label="حذف {{ doc.name }}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Upload Dialog -->
      @if (showUploadDialog()) {
        <app-upload-dialog [caseId]="caseId()" (closed)="showUploadDialog.set(false)" (uploaded)="onUploaded()"></app-upload-dialog>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .doc-list { }

    /* Header */
    .doc-list__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }
    .doc-list__title { font-size: var(--text-lg); font-weight: var(--font-bold); color: var(--clr-secondary); margin: 0; }
    .doc-list__upload-btn { display: inline-flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-4); border: 1px solid var(--clr-primary); border-radius: var(--radius-sm); background: var(--clr-primary-light); color: var(--clr-primary); font-size: var(--text-sm); font-weight: var(--font-semibold); cursor: pointer; transition: all var(--transition-fast); }
    .doc-list__upload-btn:hover { background: var(--clr-primary); color: white; }
    .doc-list__upload-btn svg { width: 16px; height: 16px; }

    /* Grid */
    .doc-list__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-3); }

    /* Card */
    .doc-card { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-4); background: var(--clr-white); border: 1px solid var(--clr-border); border-radius: var(--radius-lg); transition: all var(--transition); }
    .doc-card:hover { box-shadow: var(--shadow-md); border-color: var(--clr-primary); transform: translateY(-2px); }

    /* Icon */
    .doc-card__icon { width: 44px; height: 44px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .doc-card__icon svg { width: 22px; height: 22px; }
    .doc-card__icon--pdf { background: #fef2f2; color: #ea3f48; }
    .doc-card__icon--word { background: #eff6ff; color: #3b82f6; }
    .doc-card__icon--image { background: #f0fdf4; color: #16a34a; }

    /* Info */
    .doc-card__info { flex: 1; min-width: 0; }
    .doc-card__name { font-size: var(--text-md); font-weight: var(--font-semibold); color: var(--clr-secondary); margin: 0 0 var(--space-1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .doc-card__meta { display: flex; align-items: center; gap: var(--space-2); }
    .doc-card__type { font-size: var(--text-xs); font-weight: var(--font-bold); padding: var(--space-1) var(--space-2); border-radius: var(--radius-sm); white-space: nowrap; }
    .doc-card__type--contract { background: var(--clr-accent-blue-light); color: var(--clr-accent-blue); }
    .doc-card__type--evidence { background: var(--clr-accent-amber-light); color: var(--clr-accent-amber); }
    .doc-card__type--judgment { background: var(--clr-accent-green-light); color: var(--clr-accent-green); }
    .doc-card__type--correspondence { background: var(--clr-accent-purple-light); color: var(--clr-accent-purple); }
    .doc-card__date { font-size: var(--text-xs); color: var(--clr-text-muted); }

    /* Actions */
    .doc-card__actions { display: flex; gap: var(--space-1); flex-shrink: 0; }
    .doc-card__action { width: 32px; height: 32px; border-radius: var(--radius-sm); border: none; background: transparent; color: var(--clr-text-muted); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all var(--transition-fast); }
    .doc-card__action:hover { background: var(--clr-secondary-light); color: var(--clr-secondary); }
    .doc-card__action:focus-visible { outline: 2px solid var(--clr-primary); outline-offset: 2px; }
    .doc-card__action--delete:hover { background: var(--clr-primary-light); color: var(--clr-error); }
    .doc-card__action svg { width: 16px; height: 16px; }

    /* Empty State */
    .doc-list__empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--space-16) var(--space-8); color: var(--clr-text-muted); text-align: center; }
    .doc-list__empty svg { width: 48px; height: 48px; margin-bottom: var(--space-4); opacity: .35; }
    .doc-list__empty p { font-size: var(--text-md); margin: 0; }

    /* Mobile */
    @media (max-width: 767px) {
      .doc-list__header { flex-direction: column; align-items: flex-start; gap: var(--space-3); }
      .doc-list__upload-btn { align-self: flex-end; }
      .doc-list__grid { grid-template-columns: 1fr; }
      .doc-card { flex-direction: column; align-items: flex-start; gap: var(--space-2); }
      .doc-card__actions { align-self: flex-end; }
      .doc-list__empty { padding: var(--space-12) var(--space-4); }
      .doc-list__empty svg { width: 40px; height: 40px; }
      .doc-list__empty p { font-size: var(--text-base); }
    }
  `],
})
export class DocumentListComponent {
  documents = input.required<Document[]>();
  caseId = input.required<number>();
  uploadRequested = output<void>();
  deleteRequested = output<number>();
  openRequested = output<Document>();

  showUploadDialog = signal(false);

  onUploaded() {
    // Refresh documents list after upload
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      contract: 'عقد',
      evidence: 'دليل',
      judgment: 'حكم',
      correspondence: 'مراسلة',
    };
    return labels[type] || type;
  }

  getFileType(filename: string): 'pdf' | 'word' | 'image' {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (['doc', 'docx'].includes(ext || '')) return 'word';
    return 'image';
  }
}
