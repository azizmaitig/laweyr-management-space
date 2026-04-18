import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../core/services/data.service';
import { TranslationService } from '../../core/services/translation.service';
import { Notification } from '../../core/models/lawyer.model';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notif-page">
      <div class="notif-header">
        <div>
          <h1>{{ t('notifications.title') }}</h1>
          @if (unreadCount > 0) {
            <span class="notif-header__badge">{{ unreadCount }} {{ t('notifications.unread') }}</span>
          }
        </div>
      </div>

      @if (notifications().length === 0) {
        <div class="empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <p>{{ t('notifications.noNotifications') }}</p>
        </div>
      } @else {
        <div class="notif-list">
          @for (notif of notifications(); track notif.id) {
            <div class="notif-card" [class]="'notif-card--' + notif.priority" [class.notif-card--unread]="!notif.read">
              <div class="notif-card__icon" [class]="'notif-card__icon--' + notif.priority">
                @if (notif.priority === 'high') {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                } @else if (notif.priority === 'medium') {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                } @else {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                }
              </div>
              <div class="notif-card__content">
                <div class="notif-card__head">
                  <h3>{{ notif.title }}</h3>
                  <span class="notif-card__date">{{ notif.date }}</span>
                </div>
                <p class="notif-card__msg">{{ notif.message }}</p>
                @if (!notif.read) {
                  <span class="notif-card__unread">● {{ t('notifications.unread') }}</span>
                }
              </div>
              <button class="notif-card__toggle" (click)="toggleRead(notif)" [title]="notif.read ? t('notifications.markUnread') : t('notifications.markRead')">
                @if (notif.read) {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                } @else {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                }
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      --clr-bg: #f4f5f7;
      --clr-surface: #ffffff;
      --clr-border: #e8eaed;
      --clr-text: #1a1d23;
      --clr-text-secondary: #6b7280;
      --clr-text-muted: #9ca3af;
      --clr-brand: #ea3f48;
      --clr-brand-dark: #0f2d5e;
      --clr-blue: #3b82f6;
      --clr-amber: #f59e0b;
      --radius-sm: 8px;
      --radius-md: 12px;
      --radius-lg: 16px;
      --shadow-card: 0 1px 3px rgba(0,0,0,.04), 0 1px 2px rgba(0,0,0,.06);
      --shadow-card-hover: 0 4px 12px rgba(0,0,0,.06);
      --transition: .2s cubic-bezier(.4,0,.2,1);
    }

    .notif-page {
      max-width: 800px;
      margin: 0 auto;
      font-family: 'Cairo', system-ui, -apple-system, sans-serif;
      color: var(--clr-text);
    }

    .notif-header {
      display: flex;
      align-items: center;
      margin-bottom: 1.25rem;
    }
    .notif-header h1 {
      font-size: 1.35rem;
      font-weight: 800;
      margin: 0;
      color: var(--clr-text);
    }
    .notif-header__badge {
      display: inline-block;
      margin-right: .65rem;
      font-size: .7rem;
      font-weight: 700;
      background: var(--clr-brand);
      color: white;
      padding: .15rem .55rem;
      border-radius: 10px;
    }

    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 1rem;
      color: var(--clr-text-muted);
    }
    .empty svg { width: 48px; height: 48px; margin-bottom: .5rem; opacity: .35; }
    .empty p { font-size: .85rem; margin: 0; }

    .notif-list { display: flex; flex-direction: column; gap: .65rem; }
    .notif-card {
      display: flex;
      align-items: flex-start;
      gap: .75rem;
      background: var(--clr-surface);
      border: 1px solid var(--clr-border);
      border-radius: var(--radius-lg);
      padding: 1rem 1.1rem;
      box-shadow: var(--shadow-card);
      transition: all var(--transition);
    }
    .notif-card:hover { box-shadow: var(--shadow-card-hover); }
    .notif-card--high { border-right: 3px solid var(--clr-brand); }
    .notif-card--medium { border-right: 3px solid var(--clr-amber); }
    .notif-card--info { border-right: 3px solid var(--clr-blue); }
    .notif-card--unread { background: #fefefe; }
    .notif-card__icon {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .notif-card__icon svg { width: 18px; height: 18px; }
    .notif-card__icon--high { background: #fef2f2; color: var(--clr-brand); }
    .notif-card__icon--medium { background: #fffbeb; color: var(--clr-amber); }
    .notif-card__icon--info { background: #eff6ff; color: var(--clr-blue); }
    .notif-card__content { flex: 1; min-width: 0; }
    .notif-card__head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: .5rem;
      margin-bottom: .15rem;
    }
    .notif-card__head h3 {
      font-size: .85rem;
      font-weight: 700;
      margin: 0;
      color: var(--clr-text);
    }
    .notif-card__date {
      font-size: .68rem;
      color: var(--clr-text-muted);
      white-space: nowrap;
    }
    .notif-card__msg {
      font-size: .78rem;
      color: var(--clr-text-secondary);
      margin: 0;
      line-height: 1.5;
    }
    .notif-card__unread {
      display: inline-block;
      font-size: .62rem;
      font-weight: 700;
      color: var(--clr-brand);
      margin-top: .2rem;
    }
    .notif-card__toggle {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--clr-border);
      background: transparent;
      color: var(--clr-text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all var(--transition);
      flex-shrink: 0;
    }
    .notif-card__toggle:hover {
      background: var(--clr-bg);
      color: var(--clr-text);
      border-color: var(--clr-text-muted);
    }
    .notif-card__toggle svg { width: 15px; height: 15px; }
  `],
})
export class NotificationsPage {
  private data = inject(DataService);
  private translation = inject(TranslationService);

  notifications = signal<Notification[]>(this.data.getNotifications());

  get unreadCount(): number {
    return this.notifications().filter(n => !n.read).length;
  }

  toggleRead(notif: Notification) {
    this.notifications.update(notifs =>
      notifs.map(n => n.id === notif.id ? { ...n, read: !n.read } : n)
    );
  }

  t(key: string): string {
    return this.translation.t(key);
  }
}
