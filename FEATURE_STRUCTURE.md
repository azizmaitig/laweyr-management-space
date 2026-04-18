# Feature Module Structure

## Example: Notes Feature

This document shows how a feature is organized using the smart/dumb component pattern.

```
features/notes/
├── components/                    # Dumb UI components
│   ├── note-list/
│   │   └── note-list.component.ts         # List with empty state, action buttons
│   └── note-editor/
│       └── note-editor.component.ts       # WYSIWYG editor with auto-save
│
└── services/                      # Smart services
    ├── notes-api.service.ts       # HTTP calls to backend
    └── notes-state.service.ts     # State management + event coordination + search
```

## Smart Component (State Service)

```typescript
// features/notes/services/notes-state.service.ts
export interface NotesState {
  notes: Note[];           // All notes from API
  filteredNotes: Note[];   // Filtered notes (after search)
  loading: boolean;
  error: string | null;
  searchQuery: string;     // Current search keyword
}

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

  // Selectors (read-only observables)
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

  // Actions (dispatch state changes)
  loadNotes(caseId: number) {
    this.patchState({ loading: true, error: null });
    this.api.getByCase(caseId).pipe(
      tap(notes => {
        this.patchState({ notes, filteredNotes: notes, loading: false });
        this.events.emit(AppEventType.NOTES_LOADED, { caseId, count: notes.length });
      }),
      catchError(err => {
        this.patchState({ loading: false, error: err.message });
        this.events.emit(AppEventType.NOTE_ERROR, err.message);
        return of([]);
      })
    ).subscribe();
  }

  searchNotes(keyword: string) {
    const current = this.state.value;
    this.patchState({ searchQuery: keyword });

    if (!keyword.trim()) {
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

  // Cross-feature event listeners
  private setupEventListeners(): void {
    this.events.on<number>(AppEventType.CASE_SELECTED)
      .subscribe(caseId => this.loadNotes(caseId));

    this.events.on<number>(AppEventType.CASE_DELETED)
      .subscribe(() => this.patchState({ notes: [] }));
  }
}
```

## Dumb Component (UI Only)

```typescript
// features/notes/components/note-list/note-list.component.ts
@Component({
  selector: 'app-note-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notes-list">
      @if (notes().length === 0) {
        <div class="notes-list__empty">
          <svg>...</svg>
          <p>لا توجد ملاحظات</p>
          <button (click)="createRequested.emit()">+ إضافة ملاحظة</button>
        </div>
      } @else {
        @for (note of notes(); track note.id) {
          <div class="note-card">
            <h4>{{ note.title || 'ملاحظة بدون عنوان' }}</h4>
            <div class="note-card__content" [innerHTML]="note.content"></div>
            <div class="note-card__actions">
              <button (click)="openRequested.emit(note)">فتح</button>
              <button (click)="updateRequested.emit(note)">تعديل</button>
              <button (click)="deleteRequested.emit(note.id)">حذف</button>
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class NoteListComponent {
  notes = input.required<Note[]>();
  createRequested = output<void>();
  updateRequested = output<Note>();
  deleteRequested = output<number>();
  openRequested = output<Note>();
}
```

## Dumb Component (WYSIWYG Editor)

```typescript
// features/notes/components/note-editor/note-editor.component.ts
@Component({
  selector: 'app-note-editor',
  standalone: true,
  imports: [CommonModule],
  template: `
    <input [placeholder]="titlePlaceholder()" (input)="onTitleInput($event)" />
    <div class="toolbar">
      <button (click)="execCmd('bold')">B</button>
      <button (click)="execCmd('italic')">I</button>
      <button (click)="execCmd('insertUnorderedList')">List</button>
      @if (autoSaveEnabled()) {
        <span [class.saving]="isSaving()">
          {{ isSaving() ? 'جاري الحفظ...' : 'تم الحفظ' }}
        </span>
      }
    </div>
    <div contenteditable="true" [attr.data-placeholder]="contentPlaceholder()"
         (input)="onContentInput($event)" (blur)="onBlur()"></div>
  `,
})
export class NoteEditorComponent implements AfterViewInit, OnDestroy {
  note = input<Note | null>(null);
  autoSaveEnabled = input(true);
  saveRequested = output<{ title?: string; content: string }>();

  private autoSaveTimer: any;

  // Auto-save after 1s of inactivity
  private triggerAutoSave() {
    if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
    this.autoSaveTimer = setTimeout(() => this.emitSave(), 1000);
  }

  ngOnDestroy() {
    if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
  }
}
```

## Smart Component (Page Orchestrator)

```typescript
// features/notes/pages/notes-page.component.ts
@Component({
  selector: 'app-notes-page',
  standalone: true,
  imports: [CommonModule, NoteListComponent, NoteEditorComponent],
  template: `
    <input type="text" [value]="searchQuery$ | async" (input)="onSearch($event)" placeholder="بحث..." />

    @if (loading$ | async) { <app-loading-spinner /> }
    @if (error$ | async; as error) { <app-error-message [message]="error" /> }

    <app-note-list
      [notes]="notes$ | async"
      (createRequested)="onCreate()"
      (updateRequested)="onEdit($event)"
      (deleteRequested)="onDelete($event)"
      (openRequested)="onOpen($event)">
    </app-note-list>

    @if (showEditor) {
      <app-note-editor
        [note]="selectedNote"
        (saveRequested)="onSave($event)">
      </app-note-editor>
    }
  `,
})
export class NotesPageComponent {
  private state = inject(NotesStateService);

  notes$ = this.state.selectNotes(caseId);
  loading$ = this.state.selectLoading();
  error$ = this.state.selectError();
  searchQuery$ = this.state.selectSearchQuery();

  onSearch(event: Event) {
    const keyword = (event.target as HTMLInputElement).value;
    this.state.searchNotes(keyword);
  }

  onSave(data: { title?: string; content: string }) {
    if (this.selectedNote) {
      this.state.updateNote(this.selectedNote.id, data);
    } else {
      this.state.createNote({ caseId, ...data });
    }
  }
}
```

## API Service

```typescript
// features/notes/services/notes-api.service.ts
export interface CreateNoteDto {
  caseId: number;
  title?: string;
  content: string;
}

export interface UpdateNoteDto {
  title?: string;
  content?: string;
}

@Injectable({ providedIn: 'root' })
export class NotesApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;
  private endpoint = '/notes';

  getByCase(caseId: number): Observable<Note[]> {
    return this.http.get<Note[]>(`${this.endpoint}/case/${caseId}`);
  }

  create(dto: CreateNoteDto): Observable<Note> {
    return this.http.post<Note>(this.endpoint, dto);
  }

  update(id: number, dto: UpdateNoteDto): Observable<Note> {
    return this.http.put<Note>(`${this.endpoint}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }

  search(caseId: number, query: string): Observable<Note[]> {
    return this.http.get<Note[]>(`${this.endpoint}/case/${caseId}/search`, { params: { q: query } });
  }
}
```

## Key Patterns

### 1. State Service Pattern
- Single `BehaviorSubject` holds all state
- `select*()` methods return filtered observables
- Actions call API, update state, emit events
- `patchState()` helper for partial updates
- Search/filter state tracked separately (`notes` vs `filteredNotes`)

### 2. Component Communication
```
Page Component (Smart)
  ├── Injects StateService
  ├── Subscribes to state observables
  └── Passes data to dumb components via input()
       │
       ├── NoteListComponent (input/output)
       └── NoteEditorComponent (input/output)
```

### 3. Event Coord (Cross-Feature)
```
Feature A emits event → EventService → Feature B listens → Updates its state

Example:
  TasksStateService completes task → emits TASK_COMPLETED
    → TimelineStateService receives → adds timeline entry
    → CasesStateService receives → logs (no action)
```

### 4. Error Handling
- API errors caught in state service
- Error state exposed via `selectError()`
- UI shows error message component
- Global error interceptor logs to console

### 5. Loading States
- Loading interceptor tracks active requests
- State service exposes `selectLoading()`
- UI shows loading spinner when true

### 6. Auto-Save Pattern
- NoteEditorComponent emits `saveRequested` after 1s of inactivity
- Forces save on blur if changes exist
- Shows saving/saved indicator in toolbar

### 7. Search/Filter Pattern
- State maintains both `notes` (all) and `filteredNotes` (search results)
- `selectNotes()` returns filtered results
- `selectAllNotes()` returns all (ignores search)
- `clearSearch()` resets to show all
