import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchResult } from '../../services/search-api.service';

@Component({
  selector: 'app-search-result-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="search-result-item"
      role="button"
      tabindex="0"
      [attr.aria-label]="'فتح: ' + result().title"
      (click)="openRequested.emit(result())"
      (keydown)="onKeydown($event)">
      <span class="search-result-item__icon" aria-hidden="true">{{ result().icon || getDefaultIcon() }}</span>
      <div class="search-result-item__info">
        <span class="search-result-item__title">{{ result().title }}</span>
        <span class="search-result-item__subtitle">{{ result().subtitle }}</span>
      </div>
      <span class="search-result-item__type">{{ getTypeLabel(result().type) }}</span>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .search-result-item { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); padding: var(--space-4) var(--space-5); border: 1px solid var(--clr-border); border-radius: var(--radius-lg); background: var(--clr-white); cursor: pointer; transition: all var(--transition); }
    .search-result-item:hover { box-shadow: var(--shadow-sm); border-color: var(--clr-primary); }
    .search-result-item:focus-visible { outline: 2px solid var(--clr-primary); outline-offset: 2px; }
    .search-result-item__icon { font-size: 1.25rem; flex-shrink: 0; }
    .search-result-item__info { flex: 1; min-width: 0; }
    .search-result-item__title { display: block; font-size: var(--text-md); font-weight: var(--font-semibold); color: var(--clr-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .search-result-item__subtitle { display: block; font-size: var(--text-sm); color: var(--clr-text-muted); margin-top: var(--space-1); }
    .search-result-item__type { font-size: var(--text-xs); font-weight: var(--font-bold); padding: var(--space-1) var(--space-2); border-radius: var(--radius-sm); background: var(--clr-secondary-light); color: var(--clr-text-secondary); white-space: nowrap; flex-shrink: 0; }

    /* Tablet */
    @media (max-width: 1023px) {
      .search-result-item { padding: var(--space-3) var(--space-4); }
    }

    /* Mobile */
    @media (max-width: 767px) {
      .search-result-item { flex-direction: column; align-items: flex-start; gap: var(--space-2); padding: var(--space-3) var(--space-4); }
      .search-result-item__icon { font-size: 1rem; }
      .search-result-item__title { font-size: var(--text-base); }
      .search-result-item__subtitle { font-size: var(--text-xs); }
      .search-result-item__type { align-self: flex-end; }
    }
  `],
})
export class SearchResultItemComponent {
  result = input.required<SearchResult>();
  openRequested = output<SearchResult>();

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openRequested.emit(this.result());
    }
  }

  getDefaultIcon(): string {
    const icons: Record<string, string> = { case: '📁', document: '📄', task: '✅', note: '📝' };
    return icons[this.result().type] || '🔍';
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = { case: 'ملف', document: 'وثيقة', task: 'مهمة', note: 'ملاحظة' };
    return labels[type] || type;
  }
}
