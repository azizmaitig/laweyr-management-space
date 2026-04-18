import { Injectable, inject, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, tap, catchError, of, map, Subscription } from 'rxjs';
import { Task } from '../../../core/models';
import { TasksApiService, CreateTaskDto, UpdateTaskDto } from './tasks-api.service';
import { EventService } from '../../../core/services/event.service';
import { AppEventType } from '../../../core/models/events.model';

export interface TasksState {
  tasks: Task[];
  todayTasks: Task[];
  loading: boolean;
  error: string | null;
  filters: {
    status: Task['status'] | 'ALL';
    priority: Task['priority'] | 'ALL';
  };
}

const initialState: TasksState = {
  tasks: [],
  todayTasks: [],
  loading: false,
  error: null,
  filters: { status: 'ALL', priority: 'ALL' },
};

@Injectable({ providedIn: 'root' })
export class TasksStateService implements OnDestroy {
  private api = inject(TasksApiService);
  private events = inject(EventService);
  private state = new BehaviorSubject<TasksState>(initialState);
  state$ = this.state.asObservable();

  private subscriptions = new Subscription();

  constructor() {
    this.setupEventListeners();
  }

  /**
   * Subscribe to cross-feature events
   */
  private setupEventListeners(): void {
    // When a case is selected → load tasks for that case
    this.subscriptions.add(
      this.events.on<number>(AppEventType.CASE_SELECTED)
        .subscribe(caseId => this.loadTasks(caseId))
    );

    // When a case is deleted → clear tasks
    this.subscriptions.add(
      this.events.on<number>(AppEventType.CASE_DELETED)
        .subscribe(() => this.patchState({ tasks: [], todayTasks: [] }))
    );
  }

  // Selectors
  selectTasks(caseId: number): Observable<Task[]> {
    return this.state$.pipe(
      map(s => {
        let filtered = s.tasks.filter(t => t.caseId === caseId);
        if (s.filters.status !== 'ALL') {
          filtered = filtered.filter(t => t.status === s.filters.status);
        }
        if (s.filters.priority !== 'ALL') {
          filtered = filtered.filter(t => t.priority === s.filters.priority);
        }
        return filtered;
      })
    );
  }

  selectTodayTasks(): Observable<Task[]> {
    return this.state$.pipe(map(s => s.todayTasks));
  }

  selectLoading(): Observable<boolean> {
    return this.state$.pipe(map(s => s.loading));
  }

  selectError(): Observable<string | null> {
    return this.state$.pipe(map(s => s.error));
  }

  selectFilters(): Observable<{ status: Task['status'] | 'ALL'; priority: Task['priority'] | 'ALL' }> {
    return this.state$.pipe(map(s => s.filters));
  }

  // Actions

  /**
   * Set status filter
   */
  setStatusFilter(status: Task['status'] | 'ALL') {
    const current = this.state.value;
    this.state.next({ ...current, filters: { ...current.filters, status } });
  }

  /**
   * Set priority filter
   */
  setPriorityFilter(priority: Task['priority'] | 'ALL') {
    const current = this.state.value;
    this.state.next({ ...current, filters: { ...current.filters, priority } });
  }

  /**
   * Clear all filters
   */
  clearFilters() {
    const current = this.state.value;
    this.state.next({ ...current, filters: { status: 'ALL', priority: 'ALL' } });
  }

  /**
   * Load all tasks for a case
   */
  loadTasks(caseId: number) {
    this.patchState({ loading: true, error: null });
    this.api.getByCase(caseId).pipe(
      tap(tasks => {
        this.patchState({ tasks, loading: false });
        this.events.emit(AppEventType.TASKS_LOADED, { caseId, count: tasks.length });
      }),
      catchError((err: { message: string }) => {
        this.patchState({ loading: false, error: err.message });
        this.events.emit(AppEventType.TASK_ERROR, err.message);
        return of([]);
      })
    ).subscribe();
  }

  /**
   * Load today's tasks
   */
  loadTodayTasks() {
    this.api.getTodayTasks().pipe(
      tap(tasks => this.patchState({ todayTasks: tasks })),
      catchError(() => of([]))
    ).subscribe();
  }

  /**
   * Create a new task
   */
  createTask(dto: CreateTaskDto) {
    this.api.create(dto).pipe(
      tap(task => {
        const current = this.state.value;
        this.state.next({ ...current, tasks: [...current.tasks, task] });
        this.events.emit(AppEventType.TASK_CREATED, {
          caseId: task.caseId,
          taskId: task.id,
          title: task.title,
          status: task.status,
          dueDate: task.dueDate,
        });
      }),
      catchError((err: { message: string }) => {
        this.events.emit(AppEventType.TASK_ERROR, err.message);
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Update a task
   */
  updateTask(id: number, dto: UpdateTaskDto) {
    this.api.update(id, dto).pipe(
      tap(updated => {
        const current = this.state.value;
        this.state.next({ ...current, tasks: current.tasks.map(t => t.id === id ? updated : t) });
        this.events.emit(AppEventType.TASK_UPDATED, {
          caseId: updated.caseId,
          taskId: updated.id,
          title: updated.title,
          status: updated.status,
          dueDate: updated.dueDate,
        });

        // If task was marked as DONE → emit TASK_COMPLETED event for timeline
        if (dto.status === 'DONE' && updated.status === 'DONE') {
          this.events.emit(AppEventType.TASK_COMPLETED, {
            caseId: updated.caseId,
            taskId: updated.id,
            title: updated.title,
            status: updated.status,
            dueDate: updated.dueDate,
          });
        }
      }),
      catchError((err: { message: string }) => {
        this.events.emit(AppEventType.TASK_ERROR, err.message);
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Delete a task
   */
  deleteTask(id: number) {
    // Find task before deleting to get its metadata
    const taskToDelete = this.state.value.tasks.find(t => t.id === id);
    this.patchState({ loading: true, error: null });
    this.api.delete(id).pipe(
      tap(() => {
        const current = this.state.value;
        this.state.next({ ...current, tasks: current.tasks.filter(t => t.id !== id), loading: false });
        this.events.emit(AppEventType.TASK_DELETED, {
          caseId: taskToDelete?.caseId ?? 0,
          taskId: id,
          title: taskToDelete?.title ?? '',
          status: taskToDelete?.status ?? 'TODO',
          dueDate: taskToDelete?.dueDate,
        });
      }),
      catchError((err: { message: string }) => {
        this.patchState({ loading: false, error: err.message });
        this.events.emit(AppEventType.TASK_ERROR, err.message);
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Mark a task as complete
   * Emits TASK_COMPLETED event for timeline integration
   */
  completeTask(id: number) {
    const task = this.state.value.tasks.find(t => t.id === id);
    if (!task || task.status === 'DONE') return;

    this.api.update(id, { status: 'DONE' }).pipe(
      tap(updated => {
        const current = this.state.value;
        this.state.next({ ...current, tasks: current.tasks.map(t => t.id === id ? updated : t) });
        this.events.emit(AppEventType.TASK_UPDATED, {
          caseId: updated.caseId,
          taskId: updated.id,
          title: updated.title,
          status: updated.status,
          dueDate: updated.dueDate,
        });
        this.events.emit(AppEventType.TASK_COMPLETED, {
          caseId: updated.caseId,
          taskId: updated.id,
          title: updated.title,
          status: updated.status,
          dueDate: updated.dueDate,
        });
      }),
      catchError((err: { message: string }) => {
        this.events.emit(AppEventType.TASK_ERROR, err.message);
        return of(null);
      })
    ).subscribe();
  }

  private patchState(partial: Partial<TasksState>) {
    const current = this.state.value;
    this.state.next({ ...current, ...partial });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
