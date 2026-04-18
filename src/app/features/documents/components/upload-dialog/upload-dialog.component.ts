import { Component, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Document, DocumentType } from '../../../../core/models';
import { DocumentsStateService } from '../../services/documents-state.service';

@Component({
  selector: 'app-upload-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="upload-dialog__backdrop" (click)="closed.emit()">
      <div class="upload-dialog" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" aria-labelledby="upload-dialog-title">
        <!-- Header -->
        <header class="upload-dialog__header">
          <h3 id="upload-dialog-title" class="upload-dialog__title">رفع وثيقة جديدة</h3>
          <button class="upload-dialog__close" (click)="closed.emit()" aria-label="إغلاق">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </header>

        <!-- Body -->
        <div class="upload-dialog__body">
          <!-- Drop Zone -->
          <div
            class="upload-dialog__dropzone"
            [class.upload-dialog__dropzone--dragover]="isDragOver()"
            (dragover)="onDragOver($event)"
            (dragleave)="onDragLeave()"
            (drop)="onDrop($event)">
            @if (selectedFile()) {
              <div class="upload-dialog__file-preview">
                <div class="upload-dialog__file-icon" [class]="'upload-dialog__file-icon--' + getFileType(selectedFile()!.name)">
                  @if (getFileType(selectedFile()!.name) === 'pdf') {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  } @else if (getFileType(selectedFile()!.name) === 'word') {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  } @else {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  }
                </div>
                <div class="upload-dialog__file-info">
                  <span class="upload-dialog__file-name">{{ selectedFile()!.name }}</span>
                  <span class="upload-dialog__file-size">{{ formatFileSize(selectedFile()!.size) }}</span>
                </div>
                <button class="upload-dialog__file-remove" (click)="selectedFile.set(null)" aria-label="إزالة الملف">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            } @else {
              <svg class="upload-dialog__dropzone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <p class="upload-dialog__dropzone-text">اسحب الملف هنا أو</p>
              <label class="upload-dialog__browse-btn">
                اختيار ملف
                <input type="file" hidden (change)="onFileSelected($event)" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png">
              </label>
              <p class="upload-dialog__dropzone-hint">PDF, Word, Images (max 10MB)</p>
            }
          </div>

          <!-- Type Selector -->
          <div class="upload-dialog__field">
            <label class="upload-dialog__label" for="doc-type">نوع الوثيقة</label>
            <select id="doc-type" class="upload-dialog__select" [(ngModel)]="selectedType" name="docType">
              <option value="contract">عقد</option>
              <option value="evidence">دليل</option>
              <option value="judgment">حكم</option>
              <option value="correspondence">مراسلة</option>
            </select>
          </div>
        </div>

        <!-- Footer -->
        <footer class="upload-dialog__footer">
          <button class="upload-dialog__btn upload-dialog__btn--cancel" (click)="closed.emit()">إلغاء</button>
          <button class="upload-dialog__btn upload-dialog__btn--upload" (click)="onUpload()" [disabled]="!selectedFile() || isUploading()">
            @if (isUploading()) {
              <svg class="upload-dialog__spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-dasharray="31.4" stroke-dashoffset="10"/></svg>
              جاري الرفع...
            } @else {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              رفع
            }
          </button>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    /* Backdrop */
    .upload-dialog__backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: var(--space-8); animation: upload-fade-in .2s ease; }
    @keyframes upload-fade-in { from { opacity: 0; } to { opacity: 1; } }

    /* Dialog */
    .upload-dialog { background: var(--clr-white); border-radius: var(--radius-2xl); width: 100%; max-width: 480px; max-height: 90vh; display: flex; flex-direction: column; animation: upload-slide-in .2s ease; }
    @keyframes upload-slide-in { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    /* Header */
    .upload-dialog__header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-5) var(--space-6); border-bottom: 1px solid var(--clr-border); }
    .upload-dialog__title { font-size: var(--text-lg); font-weight: var(--font-bold); color: var(--clr-secondary); margin: 0; }
    .upload-dialog__close { width: 32px; height: 32px; border-radius: var(--radius-sm); border: none; background: transparent; color: var(--clr-text-muted); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all var(--transition-fast); }
    .upload-dialog__close:hover { background: var(--clr-secondary-light); color: var(--clr-secondary); }
    .upload-dialog__close svg { width: 18px; height: 18px; }

    /* Body */
    .upload-dialog__body { padding: var(--space-6); overflow-y: auto; flex: 1; }

    /* Drop Zone */
    .upload-dialog__dropzone { border: 2px dashed var(--clr-border); border-radius: var(--radius-lg); padding: var(--space-8) var(--space-6); text-align: center; transition: all var(--transition-fast); cursor: pointer; }
    .upload-dialog__dropzone--dragover { border-color: var(--clr-primary); background: var(--clr-primary-light); }
    .upload-dialog__dropzone-icon { width: 48px; height: 48px; color: var(--clr-text-muted); margin: 0 auto var(--space-3); }
    .upload-dialog__dropzone-text { font-size: var(--text-sm); color: var(--clr-text-secondary); margin: 0 0 var(--space-3); }
    .upload-dialog__browse-btn { display: inline-block; padding: var(--space-2) var(--space-4); background: var(--clr-primary); color: white; border-radius: var(--radius-sm); font-size: var(--text-sm); font-weight: var(--font-semibold); cursor: pointer; transition: all var(--transition-fast); }
    .upload-dialog__browse-btn:hover { background: var(--clr-primary-hover); }
    .upload-dialog__dropzone-hint { font-size: var(--text-xs); color: var(--clr-text-muted); margin: var(--space-2) 0 0; }

    /* File Preview */
    .upload-dialog__file-preview { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-4); background: var(--clr-secondary-light); border-radius: var(--radius-md); }
    .upload-dialog__file-icon { width: 44px; height: 44px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .upload-dialog__file-icon svg { width: 22px; height: 22px; }
    .upload-dialog__file-icon--pdf { background: #fef2f2; color: #ea3f48; }
    .upload-dialog__file-icon--word { background: #eff6ff; color: #3b82f6; }
    .upload-dialog__file-icon--image { background: #f0fdf4; color: #16a34a; }
    .upload-dialog__file-info { flex: 1; text-align: right; }
    .upload-dialog__file-name { display: block; font-size: var(--text-sm); font-weight: var(--font-semibold); color: var(--clr-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .upload-dialog__file-size { display: block; font-size: var(--text-xs); color: var(--clr-text-muted); }
    .upload-dialog__file-remove { width: 28px; height: 28px; border-radius: var(--radius-sm); border: none; background: transparent; color: var(--clr-text-muted); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all var(--transition-fast); flex-shrink: 0; }
    .upload-dialog__file-remove:hover { background: var(--clr-primary-light); color: var(--clr-error); }
    .upload-dialog__file-remove svg { width: 14px; height: 14px; }

    /* Field */
    .upload-dialog__field { margin-top: var(--space-4); }
    .upload-dialog__label { display: block; font-size: var(--text-sm); font-weight: var(--font-semibold); color: var(--clr-text-secondary); margin-bottom: var(--space-1); }
    .upload-dialog__select { width: 100%; padding: var(--space-2) var(--space-3); border: 1.5px solid var(--clr-border); border-radius: var(--radius-md); font-size: var(--text-sm); color: var(--clr-secondary); background: var(--clr-white); outline: none; transition: border-color var(--transition-fast); }
    .upload-dialog__select:focus { border-color: var(--clr-primary); }

    /* Footer */
    .upload-dialog__footer { display: flex; justify-content: flex-end; gap: var(--space-3); padding: var(--space-4) var(--space-6); border-top: 1px solid var(--clr-border); }
    .upload-dialog__btn { display: inline-flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-5); border: none; border-radius: var(--radius-sm); font-size: var(--text-sm); font-weight: var(--font-semibold); cursor: pointer; transition: all var(--transition-fast); }
    .upload-dialog__btn svg { width: 16px; height: 16px; }
    .upload-dialog__btn--cancel { background: var(--clr-secondary-light); color: var(--clr-text-secondary); }
    .upload-dialog__btn--cancel:hover { background: var(--clr-border); }
    .upload-dialog__btn--upload { background: var(--clr-primary); color: white; }
    .upload-dialog__btn--upload:hover:not(:disabled) { background: var(--clr-primary-hover); }
    .upload-dialog__btn--upload:disabled { opacity: 0.5; cursor: not-allowed; }
    .upload-dialog__spinner { width: 16px; height: 16px; animation: upload-spin 1s linear infinite; }
    @keyframes upload-spin { to { transform: rotate(360deg); } }

    /* Mobile */
    @media (max-width: 767px) {
      .upload-dialog__backdrop { padding: var(--space-4); }
      .upload-dialog { border-radius: var(--radius-xl); }
      .upload-dialog__header { padding: var(--space-4); }
      .upload-dialog__body { padding: var(--space-4); }
      .upload-dialog__footer { padding: var(--space-3) var(--space-4); }
      .upload-dialog__dropzone { padding: var(--space-6) var(--space-4); }
    }
  `],
})
export class UploadDialogComponent {
  private documentsState = inject(DocumentsStateService);

  caseId = input.required<number>();
  closed = output<void>();
  uploaded = output<void>();

  selectedFile = signal<File | null>(null);
  selectedType = 'contract';
  isDragOver = signal(false);
  isUploading = signal(false);

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave() {
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.selectedFile.set(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);
    }
  }

  async onUpload() {
    const file = this.selectedFile();
    if (!file) return;

    this.isUploading.set(true);

    // Simulate upload - replace with actual API call
    setTimeout(() => {
      this.documentsState.uploadDocument(file, this.caseId(), this.selectedType as DocumentType);

      this.isUploading.set(false);
      this.uploaded.emit();
      this.closed.emit();
    }, 1500);
  }

  getFileType(filename: string): 'pdf' | 'word' | 'image' {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (['doc', 'docx'].includes(ext || '')) return 'word';
    return 'image';
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
