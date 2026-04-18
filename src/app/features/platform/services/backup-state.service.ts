import { Injectable, inject, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, catchError, map, of, switchMap, tap, timer } from 'rxjs';
import type { Backup } from '../../../core/models';
import { AppEventType } from '../../../core/models/events.model';
import type { BackupLifecyclePayload } from '../../../core/models/platform-events.model';
import { EventService } from '../../../core/services/event.service';
import { BackupApiService } from './backup-api.service';

export interface BackupState {
  backups: Backup[];
  loading: boolean;
  error: string | null;
  /** True while a trigger request is in flight */
  backupRunning: boolean;
}

const initialState: BackupState = {
  backups: [],
  loading: false,
  error: null,
  backupRunning: false,
};

const DAY_MS = 86_400_000;

@Injectable({ providedIn: 'root' })
export class BackupStateService implements OnDestroy {
  private api = inject(BackupApiService);
  private events = inject(EventService);

  private state = new BehaviorSubject<BackupState>(initialState);
  state$ = this.state.asObservable();

  private scheduleSub = Subscription.EMPTY;

  ngOnDestroy(): void {
    this.scheduleSub.unsubscribe();
  }

  /**
   * Starts a 24h timer that triggers encrypted (AES-256) backups.
   * Idempotent: unsubscribes any previous schedule.
   */
  startDailyAutomaticBackups(): void {
    this.scheduleSub.unsubscribe();
    this.scheduleSub = timer(DAY_MS, DAY_MS)
      .pipe(switchMap(() => this.runBackupInternal(true)))
      .subscribe();
  }

  selectBackups(): Observable<Backup[]> {
    return this.state$.pipe(map(s => s.backups));
  }

  selectLoading(): Observable<boolean> {
    return this.state$.pipe(map(s => s.loading));
  }

  selectError(): Observable<string | null> {
    return this.state$.pipe(map(s => s.error));
  }

  selectBackupRunning(): Observable<boolean> {
    return this.state$.pipe(map(s => s.backupRunning));
  }

  getBackups(): void {
    this.patchState({ loading: true, error: null });
    this.api.getBackups().pipe(
      tap(backups => this.patchState({ backups, loading: false })),
      catchError((err: { message: string }) => {
        this.patchState({ loading: false, error: err.message });
        return of([]);
      })
    ).subscribe();
  }

  /** Manual / scheduled backup — encrypted by default (secure backups). */
  runBackup(): void {
    this.runBackupInternal(true).subscribe();
  }

  restoreBackup(id: number): void {
    this.patchState({ loading: true, error: null });
    this.api.restoreBackup(id).pipe(
      tap(() => this.patchState({ loading: false })),
      catchError((err: { message: string }) => {
        this.patchState({ loading: false, error: err.message });
        return of(null);
      })
    ).subscribe();
  }

  private runBackupInternal(encrypted: boolean) {
    const started: BackupLifecyclePayload = {
      action: 'backup_started',
      entity: 'backup',
      status: 'IN_PROGRESS',
    };
    this.events.emit(AppEventType.BACKUP_STARTED, started);
    this.patchState({ backupRunning: true, error: null });

    return this.api.triggerBackup({ encrypted }).pipe(
      tap(backup => {
        const cur = this.state.value;
        this.patchState({
          backups: [backup, ...cur.backups],
          backupRunning: false,
        });
        const success: BackupLifecyclePayload = {
          action: 'backup_success',
          entity: 'backup',
          entityId: backup.id,
          status: 'SUCCESS',
          location: backup.location,
        };
        this.events.emit(AppEventType.BACKUP_SUCCESS, success);
      }),
      catchError((err: { message: string }) => {
        this.patchState({ backupRunning: false, error: err.message });
        const failed: BackupLifecyclePayload = {
          action: 'backup_failed',
          entity: 'backup',
          status: 'FAILED',
          message: err.message,
        };
        this.events.emit(AppEventType.BACKUP_FAILED, failed);
        return of(null);
      })
    );
  }

  private patchState(partial: Partial<BackupState>): void {
    this.state.next({ ...this.state.value, ...partial });
  }
}
