import { Injectable, inject, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, tap, catchError, of, map, Subscription } from 'rxjs';
import { Note } from '../../../core/models';
import { NotesApiService, CreateNoteDto, UpdateNoteDto } from './notes-api.service';
import { EventService } from '../../../core/services/event.service';
import { AppEventType } from '../../../core/models/events.model';

export interface NotesState {
  notes: Note[];
  filteredNotes: Note[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
}

const initialState: NotesState = { notes: [], filteredNotes: [], loading: false, error: null, searchQuery: '' };

@Injectable({ providedIn: 'root' })
export class NotesStateService implements OnDestroy {
  private api = inject(NotesApiService);
  private events = inject(EventService);
  private state = new BehaviorSubject<NotesState>(initialState);
  state$ = this.state.asObservable();

  private subscriptions = new Subscription();

  constructor() {
    this.setupEventListeners();
  }

  /**
   * Subscribe to cross-feature events
   */
  private setupEventListeners(): void {
    // When a case is selected → load notes for that case
    this.subscriptions.add(
      this.events.on<number>(AppEventType.CASE_SELECTED)
        .subscribe(caseId => this.loadNotes(caseId))
    );

    // When a case is deleted → clear notes
    this.subscriptions.add(
      this.events.on<number>(AppEventType.CASE_DELETED)
        .subscribe(() => this.patchState({ notes: [] }))
    );
  }

  // Selectors
  selectNotes(caseId: number): Observable<Note[]> {
    return this.state$.pipe(map(s => s.filteredNotes.filter(n => n.caseId === caseId)));
  }

  selectAllNotes(caseId: number): Observable<Note[]> {
    return this.state$.pipe(map(s => s.notes.filter(n => n.caseId === caseId)));
  }

  selectLoading(): Observable<boolean> {
    return this.state$.pipe(map(s => s.loading));
  }

  selectError(): Observable<string | null> {
    return this.state$.pipe(map(s => s.error));
  }

  selectSearchQuery(): Observable<string> {
    return this.state$.pipe(map(s => s.searchQuery));
  }

  // Actions

  /**
   * Load all notes for a case
   */
  loadNotes(caseId: number) {
    this.patchState({ loading: true, error: null });
    this.api.getByCase(caseId).pipe(
      tap(notes => {
        this.patchState({ notes, filteredNotes: notes, loading: false });
        this.events.emit(AppEventType.NOTES_LOADED, { caseId, count: notes.length });
      }),
      catchError((err: { message: string }) => {
        this.patchState({ loading: false, error: err.message });
        this.events.emit(AppEventType.NOTE_ERROR, err.message);
        return of([]);
      })
    ).subscribe();
  }

  /**
   * Search notes by keyword
   * Filters notes by title and content
   */
  searchNotes(keyword: string) {
    const current = this.state.value;
    this.patchState({ searchQuery: keyword });

    if (!keyword.trim()) {
      // If no keyword, show all notes
      this.patchState({ filteredNotes: current.notes });
      return;
    }

    const query = keyword.toLowerCase().trim();
    const filtered = current.notes.filter(n =>
      (n.title ?? '').toLowerCase().includes(query) ||
      n.content.toLowerCase().includes(query)
    );
    this.patchState({ filteredNotes: filtered });
  }

  /**
   * Clear search and show all notes
   */
  clearSearch() {
    const current = this.state.value;
    this.patchState({ searchQuery: '', filteredNotes: current.notes });
  }

  /**
   * Create a new note
   */
  createNote(dto: CreateNoteDto) {
    this.api.create(dto).pipe(
      tap(note => {
        const current = this.state.value;
        const newNotes = [note, ...current.notes];
        // Also add to filtered notes if search is active
        const matchesSearch = !current.searchQuery ||
          (note.title ?? '').toLowerCase().includes(current.searchQuery.toLowerCase()) ||
          note.content.toLowerCase().includes(current.searchQuery.toLowerCase());
        const newFiltered = matchesSearch ? [note, ...current.filteredNotes] : current.filteredNotes;
        this.state.next({ ...current, notes: newNotes, filteredNotes: newFiltered });
        this.events.emit(AppEventType.NOTE_ADDED, {
          caseId: note.caseId,
          noteId: note.id,
          title: note.title ?? note.content.substring(0, 50),
          createdAt: note.createdAt,
        });
      }),
      catchError((err: { message: string }) => {
        this.events.emit(AppEventType.NOTE_ERROR, err.message);
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Update a note
   */
  updateNote(id: number, dto: UpdateNoteDto) {
    this.api.update(id, dto).pipe(
      tap(updated => {
        const current = this.state.value;
        const newNotes = current.notes.map(n => n.id === id ? updated : n);
        const newFiltered = current.filteredNotes.map(n => n.id === id ? updated : n);
        this.state.next({ ...current, notes: newNotes, filteredNotes: newFiltered });
        this.events.emit(AppEventType.NOTE_UPDATED, {
          caseId: updated.caseId,
          noteId: updated.id,
          title: updated.title ?? updated.content.substring(0, 50),
          createdAt: updated.createdAt,
        });
      }),
      catchError((err: { message: string }) => {
        this.events.emit(AppEventType.NOTE_ERROR, err.message);
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Delete a note
   */
  deleteNote(id: number) {
    const noteToDelete = this.state.value.notes.find(n => n.id === id);
    this.patchState({ loading: true, error: null });
    this.api.delete(id).pipe(
      tap(() => {
        const current = this.state.value;
        this.state.next({
          ...current,
          notes: current.notes.filter(n => n.id !== id),
          filteredNotes: current.filteredNotes.filter(n => n.id !== id),
          loading: false,
        });
        this.events.emit(AppEventType.NOTE_DELETED, {
          caseId: noteToDelete?.caseId ?? 0,
          noteId: id,
          title: noteToDelete?.title ?? noteToDelete?.content.substring(0, 50) ?? '',
          createdAt: noteToDelete?.createdAt ?? '',
        });
      }),
      catchError((err: { message: string }) => {
        this.patchState({ loading: false, error: err.message });
        this.events.emit(AppEventType.NOTE_ERROR, err.message);
        return of(null);
      })
    ).subscribe();
  }

  private patchState(partial: Partial<NotesState>) {
    const current = this.state.value;
    this.state.next({ ...current, ...partial });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
