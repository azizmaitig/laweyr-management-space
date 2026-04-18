import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DataService } from '../../core/services/data.service';

@Component({
  selector: 'app-espace-avocat-shell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="ea-shell" dir="rtl">
      <!-- Top Bar -->
      <header class="ea-topbar">
        <div class="ea-topbar__inner">
          <div class="ea-topbar__brand">
            <div class="ea-topbar__logo">
              <svg viewBox="0 0 36 36" fill="none" width="28" height="28">
                <circle cx="18" cy="18" r="18" fill="rgba(255,255,255,.15)"/>
                <text x="18" y="24" text-anchor="middle" fill="white" font-size="16" font-weight="bold">⚖</text>
              </svg>
            </div>
            <div class="ea-topbar__info">
              <h1>{{ workspaceTitle() }}</h1>
              <p>{{ auth.user()?.name }} · {{ auth.user()?.barNumber }}</p>
            </div>
          </div>
          <div class="ea-topbar__actions">
            <button type="button" class="ea-topbar__logout" (click)="logout()" aria-label="تسجيل الخروج">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              <span class="ea-topbar__logout-label">تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </header>

      <!-- Tab Navigation -->
      <nav class="ea-tabs">
        <div class="ea-tabs__inner">
          @for (tab of tabs; track tab.key) {
            <a
              [routerLink]="['/espace-avocat', tab.key]"
              queryParamsHandling="preserve"
              routerLinkActive="ea-tabs__link--active"
              [routerLinkActiveOptions]="{exact: tab.key === 'cases'}"
              class="ea-tabs__link">
              <span class="ea-tabs__icon" [innerHTML]="tab.icon"></span>
              <span class="ea-tabs__label">{{ tab.label }}</span>
            </a>
          }
        </div>
      </nav>

      <!-- Page Content -->
      <main class="ea-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    :host {
      --clr-brand: #ea3f48;
      --clr-brand-dark: #0f2d5e;
      --clr-teal: #0d9488;
      --radius-sm: 8px;
      --radius-md: 12px;
      --radius-lg: 16px;
      --shadow-card: 0 1px 3px rgba(0,0,0,.04), 0 1px 2px rgba(0,0,0,.06);
      --transition: .2s cubic-bezier(.4,0,.2,1);
    }

    .ea-shell {
      min-height: 100vh;
      font-family: 'Cairo', system-ui, -apple-system, sans-serif;
      background: var(--clr-bg);
      color: var(--clr-text);
    }

    /* Top Bar */
    .ea-topbar {
      background: linear-gradient(135deg, #0f2d5e, #1a3a6e);
      color: white;
      padding: .75rem 1.5rem;
    }
    .ea-topbar__inner {
      max-width: 1280px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .ea-topbar__brand {
      display: flex;
      align-items: center;
      gap: .75rem;
    }
    .ea-topbar__logo {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-sm);
      background: rgba(255,255,255,.1);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .ea-topbar__info h1 {
      font-size: 1rem;
      font-weight: 800;
      margin: 0;
    }
    .ea-topbar__info p {
      font-size: .7rem;
      opacity: .7;
      margin: 0;
    }
    .ea-topbar__actions {
      display: flex;
      align-items: center;
      gap: .5rem;
    }
    .ea-topbar__logout {
      min-height: 32px;
      padding: 0 .65rem;
      gap: .4rem;
      border-radius: var(--radius-sm);
      border: none;
      background: rgba(234,63,72,.2);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all var(--transition);
    }
    .ea-topbar__logout-label {
      font-size: .72rem;
      font-weight: 700;
      white-space: nowrap;
    }
    .ea-topbar__logout:hover {
      background: rgba(234,63,72,.4);
    }
    .ea-topbar__logout svg {
      width: 16px;
      height: 16px;
    }

    /* Tabs */
    .ea-tabs {
      background: var(--clr-surface);
      border-bottom: 1px solid var(--clr-border);
      box-shadow: var(--shadow-card);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .ea-tabs__inner {
      max-width: 1280px;
      margin: 0 auto;
      display: flex;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .ea-tabs__inner::-webkit-scrollbar { display: none; }
    .ea-tabs__link {
      display: flex;
      align-items: center;
      gap: .4rem;
      padding: .75rem 1rem;
      color: var(--clr-text-secondary);
      text-decoration: none;
      font-size: .78rem;
      font-weight: 600;
      white-space: nowrap;
      border-bottom: 2px solid transparent;
      transition: all var(--transition);
    }
    .ea-tabs__link:hover {
      color: var(--clr-text);
      background: var(--clr-bg);
    }
    .ea-tabs__link--active {
      color: var(--clr-brand);
      border-bottom-color: var(--clr-brand);
    }
    .ea-tabs__icon {
      display: flex;
      width: 16px;
      height: 16px;
    }
    .ea-tabs__icon svg {
      width: 16px;
      height: 16px;
    }

    /* Content */
    .ea-content {
      max-width: 1280px;
      margin: 0 auto;
      padding: 1.25rem 1.5rem 3rem;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .ea-topbar__info p { display: none; }
      .ea-topbar__logout-label { display: none; }
      .ea-topbar__logout { padding: 0; width: 36px; min-width: 36px; }
      .ea-tabs__label { display: none; }
      .ea-tabs__link { padding: .75rem .85rem; }
    }
  `],
})
export class EspaceAvocatShellPage {
  auth = inject(AuthService);
  data = inject(DataService);

  /** Lawyer vs assistant demo titles share this shell — label reflects the active workspace. */
  workspaceTitle(): string {
    const title = (this.auth.user()?.title ?? '').toLowerCase();
    if (/assistant|assistan|clerc|greffe|secrétariat|secretariat|سكرتارية|مساعد/.test(title)) {
      return 'فضاء المساعد';
    }
    return 'فضاء المحامي';
  }

  tabs = [
    { key: 'dashboard', label: 'لوحة التحكم', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>' },
    { key: 'clients', label: 'العملاء', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
    { key: 'cases', label: 'الملفات', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>' },
    { key: 'agenda', label: 'جدول الأعمال', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' },
    { key: 'hearings', label: 'الجلسات', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' },
    { key: 'finance', label: 'المالية', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>' },
    { key: 'stats', label: 'الإحصاءات', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>' },
    { key: 'notifications', label: 'الإشعارات', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>' },
    { key: 'settings', label: 'الإعدادات', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>' },
  ];

  logout() {
    this.auth.logout();
  }
}
