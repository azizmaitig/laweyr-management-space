import { Injectable, inject, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, catchError, map, of, tap } from 'rxjs';
import type { ActivityLog } from '../../../core/models';
import { AppEventType } from '../../../core/models/events.model';
import type { ActivityLoggedPayload } from '../../../core/models/platform-events.model';
import { EventService } from '../../../core/services/event.service';
import { ActivityApiService, type LogActivityDto } from './activity-api.service';
import { PlatformSessionService } from './platform-session.service';

export interface ActivityState {
  logs: ActivityLog[];
  loading: boolean;
  error: string | null;
}

const initialState: ActivityState = {
  logs: [],
  loading: false,
  error: null,
};

@Injectable({ providedIn: 'root' })
export class ActivityStateService implements OnDestroy {
  private api = inject(ActivityApiService);
  private events = inject(EventService);
  private session = inject(PlatformSessionService);

  private state = new BehaviorSubject<ActivityState>(initialState);
  state$ = this.state.asObservable();

  private subscriptions = new Subscription();

  constructor() {
    this.setupEventAutomation();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private setupEventAutomation(): void {
    this.subscriptions.add(
      this.events.on<number>(AppEventType.CASE_SELECTED).subscribe(caseId => {
        const userId = this.session.getActorUserId() ?? 0;
        this.trackAction(userId, 'case_opened', 'case', caseId);
      })
    );
    this.subscriptions.add(
      this.events
        .on<{ caseId: number; documentId: number; name: string }>(AppEventType.DOCUMENT_UPLOADED)
        .subscribe(({ documentId }) => {
          const userId = this.session.getActorUserId() ?? 0;
          this.trackAction(userId, 'document_uploaded', 'document', documentId);
        })
    );
    this.subscriptions.add(
      this.events
        .on<{ caseId: number; taskId: number; title: string; status: string; dueDate?: string }>(
          AppEventType.TASK_UPDATED
        )
        .subscribe(({ taskId }) => {
          const userId = this.session.getActorUserId() ?? 0;
          this.trackAction(userId, 'task_updated', 'task', taskId);
        })
    );
  }

  selectLogs(): Observable<ActivityLog[]> {
    return this.state$.pipe(map(s => s.logs));
  }

  selectLoading(): Observable<boolean> {
    return this.state$.pipe(map(s => s.loading));
  }

  selectError(): Observable<string | null> {
    return this.state$.pipe(map(s => s.error));
  }

  getActivityLogs(): void {
    this.patchState({ loading: true, error: null });
    this.api.getActivityLogs().pipe(
      tap(logs => this.patchState({ logs, loading: false })),
      catchError((err: { message: string }) => {
        this.patchState({ loading: false, error: err.message });
        return of([]);
      })
    ).subscribe();
  }

  logActivity(dto: LogActivityDto): void {
    this.patchState({ loading: true, error: null });
    this.api.logActivity(dto).pipe(
      tap(log => {
        const cur = this.state.value;
        this.patchState({ logs: [log, ...cur.logs], loading: false });
        const payload: ActivityLoggedPayload = {
          userId: log.userId,
          action: log.action,
          entity: log.entity,
          entityId: log.entityId,
          status: 'recorded',
        };
        this.events.emit(AppEventType.ACTIVITY_LOGGED, payload);
      }),
      catchError((err: { message: string }) => {
        this.patchState({ loading: false, error: err.message });
        return of(null);
      })
    ).subscribe();
  }

  trackAction(userId: number, action: string, entity: string, entityId: number): void {
    this.logActivity({ userId, action, entity, entityId });
  }

  private patchState(partial: Partial<ActivityState>): void {
    this.state.next({ ...this.state.value, ...partial });
  }
}
