import { Component, inject, OnDestroy, OnInit, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subscription } from 'rxjs';
import { SearchStateService } from '../../services/search-state.service';
import { SearchFilters, SearchResult } from '../../services/search-api.service';
import { SearchResultItemComponent } from '../search-result-item/search-result-item.component';

@Component({
  selector: 'app-search-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SearchResultItemComponent],
  template: `
    <div class="search-panel">
      <div class="search-panel__input-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" [formControl]="searchControl" [attr.aria-label]="'بحث في الملفات، الوثائق، المهام، الملاحظات'" placeholder="ابحث في الملفات، الوثائق، المهام، الملاحظات..." class="search-panel__input">
        @if (loading$ | async) {
          <div class="search-panel__spinner" role="status" aria-live="polite">
            <svg class="search-panel__spinner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke-dasharray="31.4" stroke-dashoffset="10"/></svg>
            <span class="sr-only">جاري التحميل...</span>
          </div>
        }
      </div>

      @if (selectedCaseId$ | async; as caseId) {
        <div class="search-panel__case-filter">
          <span>تصفية حسب الملف #{{ caseId }}</span>
          <button class="search-panel__case-filter-clear" (click)="onClearCaseFilter()">✕ إلغاء التصفية</button>
        </div>
      }

      <div class="search-panel__filters">
        <div class="search-panel__filter-group">
          <label class="search-panel__label">النوع</label>
          <select [formControl]="typeControl" (change)="onFilterChange()" class="search-panel__select">
            <option value="">الكل</option>
            <option value="CASE">ملف</option>
            <option value="DOCUMENT">وثيقة</option>
            <option value="TASK">مهمة</option>
            <option value="NOTE">ملاحظة</option>
          </select>
        </div>
        <div class="search-panel__filter-group">
          <label class="search-panel__label">الحالة</label>
          <select [formControl]="statusControl" (change)="onFilterChange()" class="search-panel__select">
            <option value="">الكل</option>
            <option value="TODO">قيد الانتظار</option>
            <option value="IN_PROGRESS">قيد التنفيذ</option>
            <option value="DONE">مكتمل</option>
          </select>
        </div>
        <div class="search-panel__filter-group">
          <label class="search-panel__label">الأولوية</label>
          <select [formControl]="priorityControl" (change)="onFilterChange()" class="search-panel__select">
            <option value="">الكل</option>
            <option value="HIGH">عالي</option>
            <option value="MEDIUM">متوسط</option>
            <option value="LOW">منخفض</option>
          </select>
        </div>
      </div>

      @if ((recentSearches$ | async)?.length; as recentCount) {
        <div class="search-panel__recent">
          <div class="search-panel__recent-header">
            <h4>عمليات البحث الأخيرة</h4>
            <button class="search-panel__recent-clear" (click)="onClearRecent()">مسح</button>
          </div>
          <div class="search-panel__recent-list">
            @for (q of recentSearches$ | async; track q) {
              <button class="search-panel__recent-btn" (click)="onRecentSearchClick(q)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {{ q }}
              </button>
            }
          </div>
        </div>
      }

      @if ((results$ | async)?.length; as resultCount) {
        <div class="search-panel__results">
          <div class="search-panel__results-header">
            <h4>النتائج ({{ resultCount }})</h4>
            @if (selectedCaseId$ | async) {
              <span class="search-panel__results-badge">ملف محدد</span>
            }
          </div>
          <div class="search-panel__results-list">
            @for (result of results$ | async; track result.type + result.id) {
              <app-search-result-item [result]="result" (openRequested)="onResultOpen($event)"></app-search-result-item>
            }
          </div>
        </div>
      } @else if ((query$ | async)?.length) {
        <div class="search-panel__no-results">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <p>لا توجد نتائج</p>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .search-panel { background: var(--clr-white); border: 1px solid var(--clr-border); border-radius: var(--radius-2xl); padding: var(--space-6); box-shadow: var(--shadow-sm); }
    .search-panel__input-wrap { position: relative; margin-bottom: var(--space-4); }
    .search-panel__input-wrap svg { position: absolute; right: var(--space-4); top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: var(--clr-text-muted); pointer-events: none; }
    .search-panel__input { width: 100%; padding: var(--space-3) var(--space-4); padding-left: 2.5rem; border: 1.5px solid var(--clr-border); border-radius: var(--radius-md); font-family: var(--font-family-arabic); font-size: var(--text-lg); color: var(--clr-secondary); background: var(--clr-secondary-light); outline: none; transition: all var(--transition-fast); }
    .search-panel__input:focus { border-color: var(--clr-primary); background: var(--clr-white); }
    .search-panel__input:focus-visible { outline: 2px solid var(--clr-primary); outline-offset: 2px; }
    .search-panel__input::placeholder { color: var(--clr-text-muted); }
    .search-panel__spinner { position: absolute; left: var(--space-4); top: 50%; transform: translateY(-50%); }
    .search-panel__spinner-icon { width: 18px; height: 18px; animation: search-spin 1s linear infinite; }
    @keyframes search-spin { to { transform: translateY(-50%) rotate(360deg); } }
    .search-panel__case-filter { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); padding: var(--space-2) var(--space-3); background: var(--clr-accent-blue-light); border-radius: var(--radius-md); margin-bottom: var(--space-4); font-size: var(--text-sm); color: var(--clr-accent-blue); }
    .search-panel__case-filter-clear { background: none; border: none; color: var(--clr-accent-blue); font-size: var(--text-sm); font-weight: var(--font-bold); cursor: pointer; }
    .search-panel__case-filter-clear:hover { color: var(--clr-primary); }
    .search-panel__filters { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-3); margin-bottom: var(--space-4); }
    .search-panel__filter-group { display: flex; flex-direction: column; gap: var(--space-1); }
    .search-panel__label { font-size: var(--text-sm); font-weight: var(--font-semibold); color: var(--clr-text-muted); }
    .search-panel__select { padding: var(--space-2) var(--space-3); border: 1.5px solid var(--clr-border); border-radius: var(--radius-md); font-family: var(--font-family-arabic); font-size: var(--text-base); color: var(--clr-secondary); background: var(--clr-white); outline: none; transition: border-color var(--transition-fast); }
    .search-panel__select:focus { border-color: var(--clr-primary); }
    .search-panel__recent { margin-bottom: var(--space-4); }
    .search-panel__recent-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-2); }
    .search-panel__recent-header h4 { font-size: var(--text-sm); font-weight: var(--font-bold); margin: 0; color: var(--clr-text-muted); }
    .search-panel__recent-clear { background: none; border: none; color: var(--clr-text-muted); font-size: var(--text-sm); cursor: pointer; }
    .search-panel__recent-clear:hover { color: var(--clr-primary); }
    .search-panel__recent-list { display: flex; flex-wrap: wrap; gap: var(--space-2); }
    .search-panel__recent-btn { display: inline-flex; align-items: center; gap: var(--space-1); padding: var(--space-1) var(--space-3); border: 1px solid var(--clr-border); border-radius: var(--radius-full); background: var(--clr-secondary-light); font-family: var(--font-family-arabic); font-size: var(--text-sm); color: var(--clr-text-secondary); cursor: pointer; transition: all var(--transition-fast); }
    .search-panel__recent-btn:hover { border-color: var(--clr-primary); color: var(--clr-primary); }
    .search-panel__recent-btn svg { width: 12px; height: 12px; }
    .search-panel__results { margin-top: var(--space-4); }
    .search-panel__results-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3); }
    .search-panel__results-header h4 { font-size: var(--text-sm); font-weight: var(--font-bold); margin: 0; color: var(--clr-text-muted); }
    .search-panel__results-badge { font-size: var(--text-xs); font-weight: var(--font-bold); padding: var(--space-1) var(--space-2); background: var(--clr-accent-blue-light); color: var(--clr-accent-blue); border-radius: var(--radius-sm); }
    .search-panel__results-list { display: flex; flex-direction: column; gap: var(--space-2); max-height: 350px; overflow-y: auto; }
    .search-panel__results-list::-webkit-scrollbar { width: 6px; }
    .search-panel__results-list::-webkit-scrollbar-track { background: transparent; }
    .search-panel__results-list::-webkit-scrollbar-thumb { background: var(--clr-border); border-radius: var(--radius-full); }
    .search-panel__results-list::-webkit-scrollbar-thumb:hover { background: var(--clr-text-muted); }
    .search-panel__no-results { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--space-12) var(--space-6); color: var(--clr-text-muted); text-align: center; }
    .search-panel__no-results svg { width: 32px; height: 32px; margin-bottom: var(--space-3); opacity: .35; }
    .search-panel__no-results p { font-size: var(--text-md); margin: 0; }
    @media (max-width: 1023px) {
      .search-panel { padding: var(--space-4); }
      .search-panel__filters { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 767px) {
      .search-panel { padding: var(--space-3); border-radius: var(--radius-lg); }
      .search-panel__input { padding: var(--space-2) var(--space-3); font-size: var(--text-base); }
      .search-panel__input-wrap svg { width: 16px; height: 16px; right: var(--space-3); }
      .search-panel__filters { grid-template-columns: 1fr; gap: var(--space-2); }
      .search-panel__case-filter { flex-direction: column; align-items: flex-start; gap: var(--space-1); }
      .search-panel__results-list { max-height: 250px; }
      .search-panel__no-results { padding: var(--space-8) var(--space-4); }
    }
  `],
})
export class SearchPanelComponent implements OnInit, OnDestroy {
  private searchState = inject(SearchStateService);
  results$ = this.searchState.selectResults();
  loading$ = this.searchState.selectLoading();
  query$ = this.searchState.selectQuery();
  selectedCaseId$ = this.searchState.selectSelectedCaseId();
  recentSearches$ = this.searchState.selectRecentSearches();
  searchControl = new FormControl('');
  typeControl = new FormControl('');
  statusControl = new FormControl('');
  priorityControl = new FormControl('');
  searchRequested = output<{ keyword: string; filters: SearchFilters }>();
  resultOpened = output<SearchResult>();
  private subscriptions = new Subscription();

  ngOnInit() {
    this.subscriptions.add(
      this.searchControl.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(value => {
        const keyword = value || '';
        this.searchState.search(keyword, this.getFilters());
        this.searchRequested.emit({ keyword, filters: this.getFilters() });
      })
    );
  }

  ngOnDestroy() { this.subscriptions.unsubscribe(); }

  onFilterChange() {
    const filters = this.getFilters();
    this.searchState.setFilters(filters);
    this.searchRequested.emit({ keyword: this.searchControl.value || '', filters });
  }

  onClearCaseFilter() { this.searchState.clearCaseFilter(); }
  onClearRecent() { this.searchState.clearRecentSearches(); }
  onRecentSearchClick(query: string) { this.searchControl.setValue(query); }
  onResultOpen(result: SearchResult) { this.resultOpened.emit(result); }

  private getFilters(): SearchFilters {
    return {
      type: this.typeControl.value as SearchFilters['type'] || undefined,
      status: this.statusControl.value as SearchFilters['status'] || undefined,
      priority: this.priorityControl.value as SearchFilters['priority'] || undefined,
    };
  }
}
