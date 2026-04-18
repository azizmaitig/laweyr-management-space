import { Injectable, inject, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, tap, catchError, of, map, Subscription } from 'rxjs';
import { CaseTimelineEvent } from '../../../core/models';
import { TimelineApiService, CreateTimelineEventDto } from './timeline-api.service';
import { EventService } from '../../../core/services/event.service';
import { AppEventType } from '../../../core/models/events.model';

export interface TimelineState {
  events: CaseTimelineEvent[];
  loading: boolean;
  error: string | null;
}

const initialState: TimelineState = { events: [], loading: false, error: null };

@Injectable({ providedIn: 'root' })
export class TimelineStateService implements OnDestroy {
  private api = inject(TimelineApiService);
  private events = inject(EventService);
  private state = new BehaviorSubject<TimelineState>(initialState);
  state$ = this.state.asObservable();

  private subscriptions = new Subscription();

  constructor() {
    this.setupEventListeners();
  }

  /**
   * Subscribe to cross-feature events
   * When other features perform actions, automatically add timeline events
   */
  private setupEventListeners(): void {
    // When a task is completed → add timeline event
    this.subscriptions.add(
      this.events.on<{ caseId: number; taskId: number; title: string; status: string; dueDate?: string }>(AppEventType.TASK_COMPLETED)
        .subscribe(({ caseId, title, dueDate }) => {
          this.addAutoEvent({
            caseId,
            type: 'task',
            title: `Tâche complétée: ${title}`,
            description: `La tâche "${title}" a été marquée comme terminée.${dueDate ? ` Échéance: ${dueDate}` : ''}`,
            date: new Date().toISOString().split('T')[0],
          });
        })
    );

    // When a document is uploaded → add timeline event
    this.subscriptions.add(
      this.events.on<{ caseId: number; documentId: number; name: string }>(AppEventType.DOCUMENT_UPLOADED)
        .subscribe(({ caseId, name }) => {
          this.addAutoEvent({
            caseId,
            type: 'document',
            title: `Document ajouté: ${name}`,
            description: `Le document "${name}" a été ajouté au dossier.`,
            date: new Date().toISOString().split('T')[0],
          });
        })
    );

    // When a note is created → add timeline event
    this.subscriptions.add(
      this.events.on<{ caseId: number; noteId: number; title: string; createdAt: string }>(AppEventType.NOTE_ADDED)
        .subscribe(({ caseId, title, createdAt }) => {
          this.addAutoEvent({
            caseId,
            type: 'note',
            title: `Note ajoutée: ${title}`,
            description: `Une nouvelle note "${title}" a été créée.${createdAt ? ` Date: ${createdAt}` : ''}`,
            date: createdAt?.split('T')[0] ?? new Date().toISOString().split('T')[0],
          });
        })
    );

    // When a case is created → add timeline event
    this.subscriptions.add(
      this.events.on<number>(AppEventType.CASE_CREATED)
        .subscribe(caseId => {
          this.addAutoEvent({
            caseId,
            type: 'case',
            title: 'Dossier créé',
            description: 'Le dossier a été créé dans le système.',
            date: new Date().toISOString().split('T')[0],
          });
        })
    );
  }

  // Selectors
  selectEvents(caseId: number): Observable<CaseTimelineEvent[]> {
    return this.state$.pipe(map(s => s.events.filter(e => e.caseId === caseId)));
  }

  selectLoading(): Observable<boolean> {
    return this.state$.pipe(map(s => s.loading));
  }

  selectError(): Observable<string | null> {
    return this.state$.pipe(map(s => s.error));
  }

  // Actions
  loadTimeline(caseId: number) {
    this.patchState({ loading: true, error: null });
    this.api.getByCaseId(caseId).pipe(
      tap(events => {
        this.patchState({ events, loading: false });
        this.events.emit(AppEventType.TIMELINE_LOADED, { caseId, count: events.length });
      }),
      catchError((err: { message: string }) => {
        this.patchState({ loading: false, error: err.message });
        return of([]);
      })
    ).subscribe();
  }

  createEvent(dto: CreateTimelineEventDto) {
    this.api.create(dto).pipe(
      tap(event => {
        const current = this.state.value;
        this.state.next({ ...current, events: [event, ...current.events] });
        this.events.emit(AppEventType.TIMELINE_EVENT_ADDED, {
          caseId: event.caseId,
          eventTitle: event.title,
        });
      }),
      catchError((err: { message: string }) => {
        this.events.emit(AppEventType.API_ERROR, err.message);
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Add an automatic timeline event (triggered by other features)
   */
  private addAutoEvent(dto: CreateTimelineEventDto) {
    this.api.create(dto).pipe(
      tap(event => {
        const current = this.state.value;
        // Only add to state if we're viewing this case's timeline
        this.state.next({ ...current, events: [event, ...current.events] });
      }),
      catchError(() => of(null))
    ).subscribe();
  }

  updateEvent(id: number, dto: Partial<CreateTimelineEventDto>) {
    this.api.update(id, dto).pipe(
      tap(updated => {
        const current = this.state.value;
        this.state.next({
          ...current,
          events: current.events.map(e => e.id === id ? updated : e),
        });
        this.events.emit(AppEventType.TIMELINE_EVENT_ADDED, {
          caseId: updated.caseId,
          eventTitle: updated.title,
        });
      }),
      catchError((err: { message: string }) => {
        this.events.emit(AppEventType.API_ERROR, err.message);
        return of(null);
      })
    ).subscribe();
  }

  deleteEvent(id: number) {
    this.api.remove(id).pipe(
      tap(() => {
        const current = this.state.value;
        this.state.next({ ...current, events: current.events.filter(e => e.id !== id) });
        this.events.emit(AppEventType.TIMELINE_EVENT_DELETED, id);
      }),
      catchError((err: { message: string }) => {
        this.events.emit(AppEventType.API_ERROR, err.message);
        return of(null);
      })
    ).subscribe();
  }

  private patchState(partial: Partial<TimelineState>) {
    const current = this.state.value;
    this.state.next({ ...current, ...partial });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
