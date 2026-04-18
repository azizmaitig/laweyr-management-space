import { Injectable, inject, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, tap, catchError, of, map, debounceTime, distinctUntilChanged, switchMap, Subscription } from 'rxjs';
import { SearchApiService, SearchResult, SearchFilters, SearchResponse } from './search-api.service';
import { EventService } from '../../../core/services/event.service';
import { AppEventType } from '../../../core/models/events.model';

export interface SearchState {
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  query: string;
  filters: SearchFilters;
  recentSearches: string[];
  selectedCaseId: number | null;  // Auto-set when a case is selected
}

const initialState: SearchState = {
  results: [],
  loading: false,
  error: null,
  query: '',
  filters: {},
  recentSearches: [],
  selectedCaseId: null,
};

@Injectable({ providedIn: 'root' })
export class SearchStateService implements OnDestroy {
  private api = inject(SearchApiService);
  private events = inject(EventService);
  private state = new BehaviorSubject<SearchState>(initialState);
  state$ = this.state.asObservable();

  private subscriptions = new Subscription();

  constructor() {
    this.setupEventListeners();
    this.loadRecentSearches();
  }

  /**
   * Subscribe to cross-feature events
   * When any data changes, refresh the active search to keep results in sync
   */
  private setupEventListeners(): void {
    // Case selection → auto-filter search results to selected case
    this.subscriptions.add(
      this.events.on<number>(AppEventType.CASE_SELECTED)
        .subscribe(caseId => {
          this.patchState({ selectedCaseId: caseId });
          // Refresh active search with new case filter
          this.refreshIfActive();
        })
    );

    // Case events
    this.subscriptions.add(
      this.events.on<{ count: number }>(AppEventType.CASE_LOADED)
        .subscribe(() => this.refreshIfActive())
    );

    this.subscriptions.add(
      this.events.on<number>(AppEventType.CASE_CREATED)
        .subscribe(() => this.refreshIfActive())
    );

    this.subscriptions.add(
      this.events.on<number>(AppEventType.CASE_UPDATED)
        .subscribe(() => this.refreshIfActive())
    );

    this.subscriptions.add(
      this.events.on<number>(AppEventType.CASE_DELETED)
        .subscribe(() => {
          this.patchState({ selectedCaseId: null });
          this.refreshIfActive();
        })
    );

    // Document events
    this.subscriptions.add(
      this.events.on<{ caseId: number; documentId: number; name: string }>(AppEventType.DOCUMENT_UPLOADED)
        .subscribe(() => this.refreshIfActive())
    );

    this.subscriptions.add(
      this.events.on<{ caseId: number; documentId: number; name: string }>(AppEventType.DOCUMENT_UPDATED)
        .subscribe(() => this.refreshIfActive())
    );

    this.subscriptions.add(
      this.events.on<{ caseId: number; documentId: number; name: string }>(AppEventType.DOCUMENT_DELETED)
        .subscribe(() => this.refreshIfActive())
    );

    // Task events
    this.subscriptions.add(
      this.events.on<{ caseId: number; taskId: number; title: string; status: string; dueDate?: string }>(AppEventType.TASK_CREATED)
        .subscribe(() => this.refreshIfActive())
    );

    this.subscriptions.add(
      this.events.on<{ caseId: number; taskId: number; title: string; status: string; dueDate?: string }>(AppEventType.TASK_UPDATED)
        .subscribe(() => this.refreshIfActive())
    );

    this.subscriptions.add(
      this.events.on<{ caseId: number; taskId: number; title: string; status: string; dueDate?: string }>(AppEventType.TASK_COMPLETED)
        .subscribe(() => this.refreshIfActive())
    );

    this.subscriptions.add(
      this.events.on<number>(AppEventType.TASK_DELETED)
        .subscribe(() => this.refreshIfActive())
    );

    // Note events
    this.subscriptions.add(
      this.events.on<{ caseId: number; noteId: number; title: string; createdAt: string }>(AppEventType.NOTE_ADDED)
        .subscribe(() => this.refreshIfActive())
    );

    this.subscriptions.add(
      this.events.on<{ caseId: number; noteId: number; title: string; createdAt: string }>(AppEventType.NOTE_UPDATED)
        .subscribe(() => this.refreshIfActive())
    );

    this.subscriptions.add(
      this.events.on<{ caseId: number; noteId: number; title: string; createdAt: string }>(AppEventType.NOTE_DELETED)
        .subscribe(() => this.refreshIfActive())
    );
  }

  // Selectors
  selectResults(): Observable<SearchResult[]> {
    return this.state$.pipe(map(s => s.results));
  }

  selectLoading(): Observable<boolean> {
    return this.state$.pipe(map(s => s.loading));
  }

  selectError(): Observable<string | null> {
    return this.state$.pipe(map(s => s.error));
  }

  selectQuery(): Observable<string> {
    return this.state$.pipe(map(s => s.query));
  }

  selectFilters(): Observable<SearchFilters> {
    return this.state$.pipe(map(s => s.filters));
  }

  selectRecentSearches(): Observable<string[]> {
    return this.state$.pipe(map(s => s.recentSearches));
  }

  selectSelectedCaseId(): Observable<number | null> {
    return this.state$.pipe(map(s => s.selectedCaseId));
  }

  // Actions

  /**
   * Search across all entities
   * Automatically filters by selected case if one is active
   */
  search(keyword: string, filters?: SearchFilters) {
    const current = this.state.value;
    // Auto-apply case filter when a case is selected
    const autoFilters: SearchFilters = current.selectedCaseId ? { caseId: current.selectedCaseId } : {};
    const appliedFilters = { ...autoFilters, ...current.filters, ...filters };

    this.patchState({
      query: keyword,
      filters: appliedFilters,
      loading: true,
      error: null,
    });

    if (!keyword.trim()) {
      this.patchState({ results: [], loading: false });
      return;
    }

    this.api.search(keyword, appliedFilters).pipe(
      tap(response => {
        this.patchState({
          results: response.results,
          loading: false,
        });
        this.addToRecentSearches(keyword);
      }),
      catchError((err: { message: string }) => {
        this.patchState({ loading: false, error: err.message, results: [] });
        this.events.emit(AppEventType.API_ERROR, err.message);
        return of({ results: [], total: 0, query: keyword, filters: appliedFilters });
      })
    ).subscribe();
  }

  /**
   * Set filters and re-run search
   */
  setFilters(filters: SearchFilters) {
    const current = this.state.value;
    this.patchState({ filters: { ...current.filters, ...filters } });

    // Re-run search if there's an active query
    if (current.query) {
      this.search(current.query, filters);
    }
  }

  /**
   * Clear filters and re-run search
   */
  clearFilters() {
    this.patchState({ filters: {} });
    const current = this.state.value;
    if (current.query) {
      this.search(current.query);
    }
  }

  /**
   * Clear search results and reset case filter
   */
  clearSearch() {
    this.patchState({ query: '', results: [], filters: {}, selectedCaseId: null });
  }

  /**
   * Clear only the case filter (search all cases)
   */
  clearCaseFilter() {
    this.patchState({ selectedCaseId: null });
    const current = this.state.value;
    if (current.query) {
      this.search(current.query);
    }
  }

  /**
   * Refresh search if there's an active query
   * Called when data changes via events
   */
  private refreshIfActive() {
    const current = this.state.value;
    if (current.query) {
      this.search(current.query, current.filters);
    }
  }

  /**
   * Add query to recent searches (max 10)
   */
  private addToRecentSearches(query: string) {
    const current = this.state.value;
    const recent = current.recentSearches.filter(q => q !== query);
    recent.unshift(query);
    const trimmed = recent.slice(0, 10);
    this.patchState({ recentSearches: trimmed });
    localStorage.setItem('recentSearches', JSON.stringify(trimmed));
  }

  /**
   * Load recent searches from localStorage
   */
  private loadRecentSearches() {
    try {
      const stored = localStorage.getItem('recentSearches');
      if (stored) {
        this.patchState({ recentSearches: JSON.parse(stored) });
      }
    } catch {
      // Ignore parse errors
    }
  }

  /**
   * Clear recent searches
   */
  clearRecentSearches() {
    this.patchState({ recentSearches: [] });
    localStorage.removeItem('recentSearches');
  }

  private patchState(partial: Partial<SearchState>) {
    const current = this.state.value;
    this.state.next({ ...current, ...partial });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
