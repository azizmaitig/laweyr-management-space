import { Injectable, inject, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, tap, catchError, of, map, Subscription } from 'rxjs';
import { Document } from '../../../core/models';
import { DocumentsApiService } from './documents-api.service';
import { EventService } from '../../../core/services/event.service';
import { AppEventType } from '../../../core/models/events.model';

export interface DocumentsState {
  documents: Document[];
  loading: boolean;
  uploadProgress: number | null;
  error: string | null;
}

const initialState: DocumentsState = { documents: [], loading: false, uploadProgress: null, error: null };

@Injectable({ providedIn: 'root' })
export class DocumentsStateService implements OnDestroy {
  private api = inject(DocumentsApiService);
  private events = inject(EventService);
  private state = new BehaviorSubject<DocumentsState>(initialState);
  state$ = this.state.asObservable();

  private subscriptions = new Subscription();

  constructor() {
    this.setupEventListeners();
  }

  /**
   * Subscribe to cross-feature events
   */
  private setupEventListeners(): void {
    // When a case is selected → load documents for that case
    this.subscriptions.add(
      this.events.on<number>(AppEventType.CASE_SELECTED)
        .subscribe(caseId => this.loadDocuments(caseId))
    );

    // When a case is deleted → clear documents
    this.subscriptions.add(
      this.events.on<number>(AppEventType.CASE_DELETED)
        .subscribe(() => this.patchState({ documents: [], uploadProgress: null }))
    );
  }

  // Selectors
  selectDocuments(caseId: number): Observable<Document[]> {
    return this.state$.pipe(map(s => s.documents.filter(d => d.caseId === caseId)));
  }

  selectLoading(): Observable<boolean> {
    return this.state$.pipe(map(s => s.loading));
  }

  selectUploadProgress(): Observable<number | null> {
    return this.state$.pipe(map(s => s.uploadProgress));
  }

  selectError(): Observable<string | null> {
    return this.state$.pipe(map(s => s.error));
  }

  // Actions

  /**
   * Load all documents for a case
   */
  loadDocuments(caseId: number) {
    this.patchState({ loading: true, error: null });
    this.api.getByCase(caseId).pipe(
      tap(documents => {
        this.patchState({ documents, loading: false });
        this.events.emit(AppEventType.DOCUMENTS_LOADED, { caseId, count: documents.length });
      }),
      catchError((err: { message: string }) => {
        this.patchState({ loading: false, error: err.message });
        this.events.emit(AppEventType.DOCUMENT_ERROR, err.message);
        return of([]);
      })
    ).subscribe();
  }

  /**
   * Upload a file for a case
   * Handles progress tracking and emits event on success
   */
  uploadDocument(file: File, caseId: number, type: Document['type']) {
    this.patchState({ loading: true, uploadProgress: 0, error: null });

    this.api.upload(file, caseId, type).pipe(
      tap(event => {
        // Handle progress updates
        if (typeof event === 'object' && 'progress' in event) {
          this.patchState({ uploadProgress: event.progress });
          return;
        }

        // Handle successful upload
        const doc = event as Document;
        const current = this.state.value;
        this.state.next({
          ...current,
          documents: [doc, ...current.documents],
          loading: false,
          uploadProgress: null,
        });
        this.events.emit(AppEventType.DOCUMENT_UPLOADED, {
          caseId: doc.caseId,
          documentId: doc.id,
          name: doc.name,
        });
      }),
      catchError((err: { message: string }) => {
        this.patchState({ loading: false, uploadProgress: null, error: err.message });
        this.events.emit(AppEventType.DOCUMENT_ERROR, err.message);
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Delete a document
   */
  deleteDocument(id: number) {
    // Find document before deleting to get its metadata
    const docToDelete = this.state.value.documents.find(d => d.id === id);
    this.patchState({ loading: true, error: null });
    this.api.delete(id).pipe(
      tap(() => {
        const current = this.state.value;
        this.state.next({
          ...current,
          documents: current.documents.filter(d => d.id !== id),
          loading: false,
        });
        this.events.emit(AppEventType.DOCUMENT_DELETED, {
          caseId: docToDelete?.caseId ?? 0,
          documentId: id,
          name: docToDelete?.name ?? '',
        });
      }),
      catchError((err: { message: string }) => {
        this.patchState({ loading: false, error: err.message });
        this.events.emit(AppEventType.DOCUMENT_ERROR, err.message);
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Update a document's metadata
   */
  updateDocument(id: number, dto: { name?: string; type?: string }) {
    this.patchState({ loading: true, error: null });
    this.api.update(id, dto).pipe(
      tap(updated => {
        const current = this.state.value;
        this.state.next({
          ...current,
          documents: current.documents.map(d => d.id === id ? updated : d),
          loading: false,
        });
        this.events.emit(AppEventType.DOCUMENT_UPDATED, {
          caseId: updated.caseId,
          documentId: updated.id,
          name: updated.name,
        });
      }),
      catchError((err: { message: string }) => {
        this.patchState({ loading: false, error: err.message });
        this.events.emit(AppEventType.DOCUMENT_ERROR, err.message);
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Search documents within a case
   */
  searchDocuments(caseId: number, query: string) {
    this.api.search(caseId, query).pipe(
      tap(documents => this.patchState({ documents })),
      catchError(() => of([]))
    ).subscribe();
  }

  /**
   * Download a document file
   */
  downloadDocument(id: number, fileName: string) {
    this.api.download(id).pipe(
      tap(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }),
      catchError((err: { message: string }) => {
        this.events.emit(AppEventType.DOCUMENT_ERROR, err.message);
        return of(null);
      })
    ).subscribe();
  }

  private patchState(partial: Partial<DocumentsState>) {
    const current = this.state.value;
    this.state.next({ ...current, ...partial });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
