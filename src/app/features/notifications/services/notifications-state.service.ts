import { Injectable, inject, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, tap, catchError, of, map, Subscription } from 'rxjs';
import { Notification } from '../../../core/models';
import { NotificationsApiService, CreateNotificationDto } from './notifications-api.service';
import { EventService } from '../../../core/services/event.service';
import { AppEventType } from '../../../core/models/events.model';

export interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: NotificationsState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

@Injectable({ providedIn: 'root' })
export class NotificationsStateService implements OnDestroy {
  private api = inject(NotificationsApiService);
  private events = inject(EventService);
  private state = new BehaviorSubject<NotificationsState>(initialState);
  state$ = this.state.asObservable();

  private subscriptions = new Subscription();

  constructor() {
    this.setupEventListeners();
    this.loadUnreadCount();
  }

  /**
   * Listen to client activity events and create notifications
   */
  private setupEventListeners(): void {
    // When client uploads document → create notification
    this.subscriptions.add(
      this.events.on<{ caseId: number; documentId: number; name: string }>(AppEventType.DOCUMENT_UPLOADED)
        .subscribe(({ caseId, documentId, name }) => {
          this.createNotification({
            type: 'document',
            title: 'وثيقة جديدة',
            message: `تم رفع وثيقة جديدة: ${name}`,
            priority: 'medium',
            caseId,
            documentId,
          });
        })
    );

    // When client sends message (communication) → create notification
    this.subscriptions.add(
      this.events.on<{ communicationId: number; clientId: number; type: string; date: string }>(AppEventType.COMMUNICATION_ADDED)
        .subscribe(({ communicationId, clientId, type, date }) => {
          const typeLabels: Record<string, string> = {
            CALL: 'مكالمة',
            EMAIL: 'بريد إلكتروني',
            MESSAGE: 'رسالة',
            APPOINTMENT: 'موعد',
          };
          this.createNotification({
            type: 'message',
            title: 'تواصل جديد',
            message: `تم إضافة ${typeLabels[type] || 'تواصل'} جديد`,
            priority: 'medium',
            clientId,
          });
        })
    );

    // When client adds note → create notification
    this.subscriptions.add(
      this.events.on<{ caseId: number; noteId: number; title: string; createdAt: string }>(AppEventType.NOTE_ADDED)
        .subscribe(({ caseId, noteId, title }) => {
          this.createNotification({
            type: 'note',
            title: 'ملاحظة جديدة',
            message: `تم إضافة ملاحظة: ${title || 'بدون عنوان'}`,
            priority: 'info',
            caseId,
            noteId,
          });
        })
    );

    // When case is created → create notification
    this.subscriptions.add(
      this.events.on<number>(AppEventType.CASE_CREATED)
        .subscribe(caseId => {
          this.createNotification({
            type: 'case',
            title: 'ملف جديد',
            message: 'تم إنشاء ملف جديد',
            priority: 'info',
            caseId,
          });
        })
    );

    // When task is completed → create notification
    this.subscriptions.add(
      this.events.on<{ caseId: number; taskId: number; title: string; status: string; dueDate?: string }>(AppEventType.TASK_COMPLETED)
        .subscribe(({ caseId, taskId, title }) => {
          this.createNotification({
            type: 'task',
            title: 'مهمة مكتملة',
            message: `تم إكمال المهمة: ${title}`,
            priority: 'info',
            caseId,
            taskId,
          });
        })
    );

    // Platform — internal notifications (driven by EventService only)
    this.subscriptions.add(
      this.events
        .on<{ userId: number; entityId: number }>(AppEventType.USER_CREATED)
        .subscribe(({ userId }) => {
          this.createNotification({
            type: 'system',
            title: 'مستخدم جديد',
            message: `تم إنشاء مستخدم (معرّف ${userId})`,
            priority: 'info',
          });
        })
    );
    this.subscriptions.add(
      this.events
        .on<{ message?: string; status?: string }>(AppEventType.BACKUP_FAILED)
        .subscribe(payload => {
          this.createNotification({
            type: 'system',
            title: 'فشل النسخ الاحتياطي',
            message: payload.message ?? 'تعذر إتمام النسخ الاحتياطي',
            priority: 'high',
          });
        })
    );
    this.subscriptions.add(
      this.events.on<{ userId: number }>(AppEventType.SETTINGS_UPDATED).subscribe(({ userId }) => {
        this.createNotification({
          type: 'system',
          title: 'تحديث الإعدادات',
          message: `تم تحديث تفضيلات المستخدم ${userId}`,
          priority: 'info',
        });
      })
    );
  }

  // Selectors
  selectNotifications(): Observable<Notification[]> {
    return this.state$.pipe(map(s => s.notifications));
  }

  selectUnreadCount(): Observable<number> {
    return this.state$.pipe(map(s => s.unreadCount));
  }

  selectLoading(): Observable<boolean> {
    return this.state$.pipe(map(s => s.loading));
  }

  selectError(): Observable<string | null> {
    return this.state$.pipe(map(s => s.error));
  }

  selectByType(type: Notification['type']): Observable<Notification[]> {
    return this.state$.pipe(
      map(s => s.notifications.filter(n => n.type === type))
    );
  }

  selectByClient(clientId: number): Observable<Notification[]> {
    return this.state$.pipe(
      map(s => s.notifications.filter(n => n.clientId === clientId))
    );
  }

  selectByCase(caseId: number): Observable<Notification[]> {
    return this.state$.pipe(
      map(s => s.notifications.filter(n => n.caseId === caseId))
    );
  }

  // Actions

  /**
   * Load all notifications
   */
  loadNotifications() {
    this.patchState({ loading: true, error: null });
    this.api.getAll().pipe(
      tap(notifications => {
        const unreadCount = notifications.filter(n => !n.read).length;
        this.patchState({ notifications, unreadCount, loading: false });
      }),
      catchError((err: { message: string }) => {
        this.patchState({ loading: false, error: err.message });
        return of([]);
      })
    ).subscribe();
  }

  /**
   * Load unread count only
   */
  loadUnreadCount() {
    this.api.getUnreadCount().pipe(
      tap(count => this.patchState({ unreadCount: count })),
      catchError(() => of(0))
    ).subscribe();
  }

  /**
   * Load notifications by client
   */
  loadByClient(clientId: number) {
    this.api.getByClient(clientId).pipe(
      tap(notifications => this.patchState({ notifications })),
      catchError(() => of([]))
    ).subscribe();
  }

  /**
   * Load notifications by case
   */
  loadByCase(caseId: number) {
    this.api.getByCase(caseId).pipe(
      tap(notifications => this.patchState({ notifications })),
      catchError(() => of([]))
    ).subscribe();
  }

  /**
   * Mark notification as read
   */
  markAsRead(id: number) {
    this.api.markAsRead(id).pipe(
      tap(() => {
        const current = this.state.value;
        const updated = current.notifications.map(n =>
          n.id === id ? { ...n, read: true } : n
        );
        const unreadCount = updated.filter(n => !n.read).length;
        this.state.next({ ...current, notifications: updated, unreadCount });
        this.events.emit(AppEventType.NOTIFICATION_READ, id);
      }),
      catchError(() => of(null))
    ).subscribe();
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead() {
    this.api.markAllAsRead().pipe(
      tap(() => {
        const current = this.state.value;
        const updated = current.notifications.map(n => ({ ...n, read: true }));
        this.state.next({ ...current, notifications: updated, unreadCount: 0 });
      }),
      catchError(() => of(null))
    ).subscribe();
  }

  /**
   * Create a notification
   */
  createNotification(dto: CreateNotificationDto) {
    this.api.create(dto).pipe(
      tap(notification => {
        const current = this.state.value;
        this.state.next({
          ...current,
          notifications: [notification, ...current.notifications],
          unreadCount: current.unreadCount + 1,
        });
        this.events.emit(AppEventType.NOTIFICATION_CREATED, {
          id: notification.id,
          type: notification.type,
          title: notification.title,
        });
      }),
      catchError(() => of(null))
    ).subscribe();
  }

  /**
   * Delete a notification
   */
  deleteNotification(id: number) {
    this.api.delete(id).pipe(
      tap(() => {
        const current = this.state.value;
        const deleted = current.notifications.find(n => n.id === id);
        const updated = current.notifications.filter(n => n.id !== id);
        const unreadCount = deleted && !deleted.read ? current.unreadCount - 1 : current.unreadCount;
        this.state.next({ ...current, notifications: updated, unreadCount });
        this.events.emit(AppEventType.NOTIFICATION_DELETED, id);
      }),
      catchError(() => of(null))
    ).subscribe();
  }

  private patchState(partial: Partial<NotificationsState>) {
    const current = this.state.value;
    this.state.next({ ...current, ...partial });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
