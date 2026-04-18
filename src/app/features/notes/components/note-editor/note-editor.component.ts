import { Component, input, output, signal, ElementRef, viewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Note } from '../../../../core/models';

@Component({
  selector: 'app-note-editor',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="note-editor">
      <input type="text" class="note-editor__title" [attr.aria-label]="titlePlaceholder()" [placeholder]="titlePlaceholder()" [value]="currentTitle()" (input)="onTitleInput($event)" />
      <div class="note-editor__toolbar" role="toolbar" [attr.aria-label]="'أدوات التنسيق'">
        <button type="button" class="note-editor__toolbar-btn" (click)="execCmd('bold')" [attr.aria-label]="'عريض'" [attr.aria-pressed]="false"><strong>B</strong></button>
        <button type="button" class="note-editor__toolbar-btn" (click)="execCmd('italic')" [attr.aria-label]="'مائل'" [attr.aria-pressed]="false"><em>I</em></button>
        <button type="button" class="note-editor__toolbar-btn" (click)="execCmd('underline')" [attr.aria-label]="'تحته خط'" [attr.aria-pressed]="false"><u>U</u></button>
        <span class="note-editor__toolbar-sep"></span>
        <button type="button" class="note-editor__toolbar-btn" (click)="execCmd('insertUnorderedList')" [attr.aria-label]="'قائمة نقطية'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></svg>
        </button>
        <button type="button" class="note-editor__toolbar-btn" (click)="execCmd('insertOrderedList')" [attr.aria-label]="'قائمة مرقمة'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><text x="2" y="8" font-size="7" fill="currentColor">1</text><text x="2" y="14" font-size="7" fill="currentColor">2</text><text x="2" y="20" font-size="7" fill="currentColor">3</text></svg>
        </button>
        @if (autoSaveEnabled()) {
          <span class="note-editor__toolbar-sep"></span>
          <span class="note-editor__autosave" [class.note-editor__autosave--saving]="isSaving()" aria-live="polite">
            @if (isSaving()) {
              <svg class="note-editor__spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke-dasharray="31.4" stroke-dashoffset="10"/></svg>
            } @else {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
            }
            {{ isSaving() ? 'جاري الحفظ...' : 'تم الحفظ' }}
          </span>
        }
      </div>
      <div class="note-editor__content" contenteditable="true" role="textbox" [attr.aria-label]="contentPlaceholder()" [attr.data-placeholder]="contentPlaceholder()" [innerHTML]="currentContent()" (input)="onContentInput($event)" (blur)="onBlur()" #editorEl></div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .note-editor { display: flex; flex-direction: column; gap: 0; border: 1px solid var(--clr-border); border-radius: var(--radius-xl); overflow: hidden; background: var(--clr-white); }
    .note-editor__title { padding: var(--space-4) var(--space-5); border: none; border-bottom: 1px solid var(--clr-border); font-size: var(--text-lg); font-weight: var(--font-bold); color: var(--clr-secondary); outline: none; font-family: var(--font-family-arabic); }
    .note-editor__title::placeholder { color: var(--clr-text-muted); }
    .note-editor__title:focus-visible { outline: 2px solid var(--clr-primary); outline-offset: -2px; }
    .note-editor__toolbar { display: flex; align-items: center; gap: var(--space-1); padding: var(--space-2) var(--space-4); background: var(--clr-secondary-light); border-bottom: 1px solid var(--clr-border); flex-wrap: wrap; }
    .note-editor__toolbar-btn { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border: none; border-radius: var(--radius-sm); background: transparent; color: var(--clr-text-secondary); cursor: pointer; transition: all var(--transition-fast); font-size: var(--text-sm); }
    .note-editor__toolbar-btn:hover { background: var(--clr-white); color: var(--clr-secondary); }
    .note-editor__toolbar-btn:focus-visible { outline: 2px solid var(--clr-primary); outline-offset: -2px; }
    .note-editor__toolbar-btn svg { width: 14px; height: 14px; }
    .note-editor__toolbar-sep { width: 1px; height: 20px; background: var(--clr-border); margin: 0 var(--space-1); }
    .note-editor__autosave { display: inline-flex; align-items: center; gap: var(--space-1); font-size: var(--text-sm); color: var(--clr-text-muted); margin-right: auto; }
    .note-editor__autosave svg { width: 12px; height: 12px; }
    .note-editor__autosave--saving { color: var(--clr-accent-amber); }
    .note-editor__autosave--saving svg { animation: note-editor-spin 1s linear infinite; }
    @keyframes note-editor-spin { to { transform: rotate(360deg); } }
    .note-editor__content { min-height: 200px; padding: var(--space-5); font-size: var(--text-base); line-height: var(--leading-relaxed); color: var(--clr-text-secondary); outline: none; font-family: var(--font-family-arabic); }
    .note-editor__content:focus-visible { outline: 2px solid var(--clr-primary); outline-offset: -2px; }
    .note-editor__content:empty::before { content: attr(data-placeholder); color: var(--clr-text-muted); pointer-events: none; }
    .note-editor__content :first-child { margin-top: 0; }
    .note-editor__content :last-child { margin-bottom: 0; }
    .note-editor__content ul { padding-right: var(--space-6); margin: var(--space-1) 0; }
    .note-editor__content ol { padding-right: var(--space-6); margin: var(--space-1) 0; }
    .note-editor__content p { margin: var(--space-1) 0; }

    /* Tablet */
    @media (max-width: 1023px) {
      .note-editor__title { padding: var(--space-3) var(--space-4); font-size: var(--text-base); }
      .note-editor__content { padding: var(--space-4); min-height: 160px; }
    }

    /* Mobile */
    @media (max-width: 767px) {
      .note-editor { border-radius: var(--radius-lg); }
      .note-editor__title { padding: var(--space-3); font-size: var(--text-md); }
      .note-editor__toolbar { padding: var(--space-2) var(--space-3); gap: var(--space-1); }
      .note-editor__toolbar-btn { width: 26px; height: 26px; }
      .note-editor__content { padding: var(--space-3); min-height: 120px; font-size: var(--text-sm); }
    }
  `],
})
export class NoteEditorComponent implements AfterViewInit, OnDestroy {
  note = input<Note | null>(null);
  autoSaveEnabled = input(true);
  titlePlaceholder = input('عنوان الملاحظة...');
  contentPlaceholder = input('اكتب ملاحظتك هنا...');
  saveRequested = output<{ title?: string; content: string }>();
  contentChanged = output<string>();
  editorEl = viewChild<ElementRef<HTMLDivElement>>('editorEl');
  currentTitle = signal('');
  currentContent = signal('');
  isSaving = signal(false);
  private autoSaveTimer: any;
  private hasChanges = false;

  ngAfterViewInit() {
    const n = this.note();
    if (n) {
      this.currentTitle.set(n.title ?? '');
      this.currentContent.set(n.content);
    }
  }

  ngOnDestroy() {
    if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
  }

  onTitleInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.currentTitle.set(input.value);
    this.hasChanges = true;
    this.triggerAutoSave();
  }

  onContentInput(event: Event) {
    const el = event.target as HTMLDivElement;
    this.currentContent.set(el.innerHTML);
    this.hasChanges = true;
    this.triggerAutoSave();
  }

  onBlur() {
    if (this.hasChanges) this.emitSave();
  }

  execCmd(command: string) {
    document.execCommand(command, false);
    this.hasChanges = true;
    this.triggerAutoSave();
  }

  private triggerAutoSave() {
    if (!this.autoSaveEnabled()) return;
    if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
    this.isSaving.set(true);
    this.autoSaveTimer = setTimeout(() => this.emitSave(), 1000);
  }

  private emitSave() {
    this.saveRequested.emit({ title: this.currentTitle() || undefined, content: this.currentContent() });
    this.hasChanges = false;
    this.isSaving.set(false);
  }
}
