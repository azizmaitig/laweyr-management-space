import { Component, DestroyRef, OnInit, computed, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { combineLatest, distinctUntilChanged, take } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';
import { CasesStateService } from '../cases/services/cases-state.service';
import { ClientsStateService } from '../clients/services/clients-state.service';
import { NotificationsStateService } from '../notifications/services/notifications-state.service';
import { WORKSPACE_QUERY } from '../../core/constants/workspace-query-params';
import type { AgendaEvent, Case, Client, Notification } from '../../core/models';

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function hearingParts(hearingDate: string): { date: string; time: string } {
  const t = hearingDate.trim();
  if (!t) return { date: '', time: '—' };
  if (t.includes('T')) {
    const [d, rest] = t.split('T');
    return { date: d, time: (rest ?? '').slice(0, 5) || '09:00' };
  }
  return { date: t.slice(0, 10), time: '09:00' };
}

/** Agenda-style rows derived from dossier `hearingDate` (same source as الجلسات case list). */
function agendaEventsFromCases(cases: Case[]): AgendaEvent[] {
  return cases
    .filter(c => c.hearingDate?.trim())
    .map(c => {
      const { date, time } = hearingParts(c.hearingDate);
      return {
        id: c.id,
        title: c.title?.trim() ? c.title : `${c.number ?? '—'} — ${c.clientName}`,
        date,
        time,
        type: 'hearing' as const,
        description: c.court,
        location: c.court,
        caseId: c.id,
        urgent: c.status === 'urgent',
      };
    })
    .filter(e => e.date.length >= 8)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard-page">

      <!-- ════════════════════════════════════════════ -->
      <!-- WELCOME HEADER                                 -->
      <!-- ════════════════════════════════════════════ -->
      <div class="dash-header">
        <div>
          <h1>{{ t('workspace.welcome') }}، {{ auth.user()?.name }} 👋</h1>
          <p class="dash-header__sub">{{ auth.user()?.title }} · {{ auth.user()?.barNumber }}</p>
        </div>
        <div class="dash-header__aside">
          <button type="button" class="dash-header__logout" (click)="logout()">
            {{ t('auth.logout') }}
          </button>
          <div class="dash-header__date">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>{{ today }}</span>
          </div>
        </div>
      </div>

      <!-- ════════════════════════════════════════════ -->
      <!-- STAT PILLS                                     -->
      <!-- ════════════════════════════════════════════ -->
      <div class="stats-row">
        <div class="stat-pill stat-pill--blue">
          <div class="stat-pill__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          </div>
          <div class="stat-pill__info">
            <span class="stat-pill__value">{{ activeCasesCount() }}</span>
            <span class="stat-pill__label">{{ t('workspace.activeCases') }}</span>
          </div>
        </div>
        <div class="stat-pill stat-pill--amber">
          <div class="stat-pill__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div class="stat-pill__info">
            <span class="stat-pill__value">{{ pendingCasesCount() }}</span>
            <span class="stat-pill__label">{{ t('workspace.pending') }}</span>
          </div>
        </div>
        <div class="stat-pill stat-pill--red">
          <div class="stat-pill__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div class="stat-pill__info">
            <span class="stat-pill__value">{{ urgentNotifCount() }}</span>
            <span class="stat-pill__label">{{ t('workspace.urgent') }}</span>
          </div>
        </div>
        <div class="stat-pill stat-pill--teal">
          <div class="stat-pill__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div class="stat-pill__info">
            <span class="stat-pill__value">{{ totalClients() }}</span>
            <span class="stat-pill__label">{{ t('workspace.totalClients') }}</span>
          </div>
        </div>
      </div>

      <!-- ════════════════════════════════════════════ -->
      <!-- NEXT HEARING                                   -->
      <!-- ════════════════════════════════════════════ -->
      @if (nextHearing(); as nh) {
        <div class="hearing-glass">
          <div class="hearing-glass__glow"></div>
          <div class="hearing-glass__body">
            <span class="hearing-glass__tag">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {{ t('workspace.nextHearing') }}
            </span>
            <h2>{{ nh.title }}</h2>
            <p class="hearing-glass__loc">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {{ nh.location }}
            </p>
          </div>
          <div class="hearing-glass__date">
            <span class="hearing-glass__day">{{ nh.date }}</span>
            <span class="hearing-glass__time">{{ nh.time }}</span>
          </div>
        </div>
      }

      @if (selectedCase(); as sel) {
        <div class="ea-dash-case-banner" role="status">
          <span class="ea-dash-case-banner__main">
            الملف المحدد:
            <strong>{{ sel.number }}</strong>
            · {{ sel.clientName }}
          </span>
          <div class="ea-dash-case-banner__actions">
            <a
              class="ea-dash-case-banner__link"
              [routerLink]="['/espace-avocat', 'cases']"
              [queryParams]="caseDeepLinkParams(sel.id)"
              queryParamsHandling="merge"
              >فتح هذا الملف</a>
            <button type="button" class="ea-dash-case-banner__clear" (click)="clearSelectedCase()">
              إزالة التحديد
            </button>
          </div>
        </div>
      }

      <!-- ════════════════════════════════════════════ -->
      <!-- MAIN GRID: EVENTS + CASES                      -->
      <!-- ════════════════════════════════════════════ -->
      <div class="main-grid">

        <!-- Weekly Events -->
        <div class="card card--events">
          <div class="card__head">
            <div class="card__icon card__icon--teal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <h3>{{ t('workspace.weeklyEvents') }}</h3>
          </div>
          <div class="card__body">
            @for (event of weekEvents(); track event.id) {
              <div class="event-item">
                <div class="event-item__bar" [class]="'event-item__bar--' + event.type"></div>
                <div class="event-item__content">
                  <div class="event-item__meta">
                    <span class="event-item__time">{{ event.time }}</span>
                    <span class="event-item__type" [class]="'event-item__type--' + event.type">
                      {{ eventTypeLabels[event.type] }}
                    </span>
                    @if (event.urgent) {
                      <span class="event-item__urgent">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      </span>
                    }
                  </div>
                  <p class="event-item__title">{{ event.title }}</p>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Active Cases (same dossiers as الجلسات / المالية via CasesStateService) -->
        <div class="card card--cases">
          <div class="card__head card__head--with-action">
            <div class="card__head-main">
              <div class="card__icon card__icon--indigo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              </div>
              <h3>{{ t('workspace.activeCases') }}</h3>
            </div>
            <a
              routerLink="/espace-avocat/cases"
              queryParamsHandling="preserve"
              class="card__action-link"
              >عرض الكل</a>
          </div>
          <div class="card__body">
            @for (case_ of activeCasesList().slice(0, 4); track case_.id) {
              <div
                class="case-item"
                [class.case-item--selected]="selectedCase()?.id === case_.id"
                role="button"
                tabindex="0"
                (click)="onCaseRowClick(case_)"
                (keydown.enter)="onCaseRowClick(case_)"
                (keydown.space)="$event.preventDefault(); onCaseRowClick(case_)">
                <div class="case-item__top">
                  <div>
                    <span class="case-item__num">{{ case_.number }}</span>
                    <p class="case-item__name">{{ case_.clientName }}</p>
                  </div>
                  <span class="case-item__status" [class]="'case-item__status--' + case_.status">
                    {{ caseStatusLabels[case_.status] }}
                  </span>
                </div>
                <div class="case-item__progress">
                  <div class="case-item__track">
                    <div class="case-item__fill" [style.width.%]="case_.progress"></div>
                  </div>
                  <span class="case-item__pct">{{ case_.progress }}%</span>
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- ════════════════════════════════════════════ -->
      <!-- FEES + NOTIFICATIONS                             -->
      <!-- ════════════════════════════════════════════ -->
      <div class="main-grid">

        <!-- Fees -->
        <div class="card card--fees">
          <div class="card__head">
            <div class="card__icon card__icon--amber">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <h3>{{ t('workspace.feesSummary') }}</h3>
          </div>
          <div class="card__body">
            <div class="fees-overview">
              <div class="fees-overview__row">
                <span>إجمالي الأتعاب</span>
                <strong>{{ totalFees() | number:'1.0-0' }} <small>د.ت</small></strong>
              </div>
              <div class="fees-overview__row fees-overview__row--paid">
                <span>المدفوع</span>
                <strong>{{ totalPaid() | number:'1.0-0' }} <small>د.ت</small></strong>
              </div>
              <div class="fees-overview__row fees-overview__row--remaining">
                <span>المتبقي</span>
                <strong>{{ remainingFees() | number:'1.0-0' }} <small>د.ت</small></strong>
              </div>
            </div>
            <div class="fees-ring">
              <div class="fees-ring__labels">
                <span>نسبة التحصيل</span>
                <span>{{ collectionPercent() }}%</span>
              </div>
              <div class="fees-ring__track">
                <div class="fees-ring__fill" [style.width.%]="collectionPercent()"></div>
              </div>
            </div>
            @for (h of feesDetailRows(); track h.id) {
              <div class="fees-detail">
                <span class="fees-detail__client">{{ h.client }}</span>
                <span class="fees-detail__amounts">
                  <b>{{ h.paid | number:'1.0-0' }}</b>
                  <span> / {{ h.total | number:'1.0-0' }} د.ت</span>
                </span>
              </div>
            }
          </div>
        </div>

        <!-- Notifications -->
        <div class="card card--notif">
          <div class="card__head">
            <div class="card__icon card__icon--rose">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </div>
            <h3>{{ t('workspace.notifications') }}</h3>
          </div>
          <div class="card__body">
            @for (notif of recentNotifs(); track notif.id) {
              <div class="notif-item" [class]="'notif-item--' + notif.priority">
                <span class="notif-item__pulse" [class]="'notif-item__pulse--' + notif.priority"></span>
                <div class="notif-item__content">
                  <p class="notif-item__title">{{ notif.title }}</p>
                  <p class="notif-item__msg">{{ notif.message }}</p>
                </div>
              </div>
            }
          </div>
        </div>
      </div>

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
      --clr-teal: #0d9488;
      --clr-teal-light: #ccfbf1;
      --clr-amber: #f59e0b;
      --clr-amber-light: #fef3c7;
      --clr-rose: #f43f5e;
      --clr-rose-light: #ffe4e6;
      --clr-indigo: #6366f1;
      --clr-indigo-light: #e0e7ff;
      --clr-blue: #3b82f6;
      --clr-blue-light: #eff6ff;
      --radius-sm: 8px;
      --radius-md: 12px;
      --radius-lg: 16px;
      --radius-xl: 20px;
      --shadow-card: 0 1px 3px rgba(0,0,0,.04), 0 1px 2px rgba(0,0,0,.06);
      --shadow-card-hover: 0 4px 12px rgba(0,0,0,.06), 0 2px 4px rgba(0,0,0,.04);
      --transition: .2s cubic-bezier(.4,0,.2,1);
    }

    .dashboard-page {
      max-width: 1200px;
      margin: 0 auto;
      font-family: 'Cairo', system-ui, -apple-system, sans-serif;
      color: var(--clr-text);
    }

    /* ═══════════════════════════════════════════════
       HEADER
       ═══════════════════════════════════════════════ */
    .dash-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.25rem;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .dash-header h1 {
      font-size: 1.35rem;
      font-weight: 800;
      margin: 0;
      color: var(--clr-text);
    }
    .dash-header__sub {
      font-size: .78rem;
      color: var(--clr-text-muted);
      margin: .15rem 0 0;
    }
    .dash-header__aside {
      display: flex;
      align-items: center;
      gap: .65rem;
      flex-wrap: wrap;
    }
    .dash-header__logout {
      padding: .4rem .85rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--clr-border);
      background: var(--clr-surface);
      color: var(--clr-text-secondary);
      font-size: .72rem;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      transition: border-color .15s, color .15s, background .15s;
    }
    .dash-header__logout:hover {
      border-color: var(--clr-brand, #ea3f48);
      color: var(--clr-brand, #ea3f48);
      background: #fff5f5;
    }
    .dash-header__date {
      display: flex;
      align-items: center;
      gap: .35rem;
      background: var(--clr-surface);
      border: 1px solid var(--clr-border);
      padding: .35rem .75rem;
      border-radius: var(--radius-sm);
      font-size: .75rem;
      color: var(--clr-text-secondary);
      box-shadow: var(--shadow-card);
    }
    .dash-header__date svg { width: 14px; height: 14px; }

    .ea-dash-case-banner {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: .5rem;
      padding: .65rem 1rem;
      margin-bottom: 1rem;
      background: #ecfdf5;
      border: 1px solid #99f6e4;
      border-radius: 10px;
      font-size: .82rem;
      color: var(--clr-text-secondary);
    }
    .ea-dash-case-banner__main { min-width: 0; }
    .ea-dash-case-banner strong { color: var(--clr-text); }
    .ea-dash-case-banner__actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: .65rem;
    }
    .ea-dash-case-banner__link {
      font-size: .78rem;
      font-weight: 700;
      color: #0f766e;
      text-decoration: none;
      white-space: nowrap;
    }
    .ea-dash-case-banner__link:hover { text-decoration: underline; }
    .ea-dash-case-banner__clear {
      border: none;
      background: transparent;
      color: #0f766e;
      font-weight: 700;
      font-family: inherit;
      font-size: .78rem;
      cursor: pointer;
      text-decoration: underline;
      padding: 0;
    }
    .ea-dash-case-banner__clear:hover { color: #0d5c56; }

    /* ═══════════════════════════════════════════════
       STAT PILLS
       ═══════════════════════════════════════════════ */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: .75rem;
      margin-bottom: 1.25rem;
    }
    .stat-pill {
      background: var(--clr-surface);
      border: 1px solid var(--clr-border);
      border-radius: var(--radius-lg);
      padding: 1rem 1.1rem;
      display: flex;
      align-items: center;
      gap: .75rem;
      box-shadow: var(--shadow-card);
      transition: all var(--transition);
    }
    .stat-pill:hover {
      box-shadow: var(--shadow-card-hover);
      transform: translateY(-2px);
    }
    .stat-pill__icon {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .stat-pill__icon svg { width: 20px; height: 20px; }
    .stat-pill--blue .stat-pill__icon { background: var(--clr-blue-light); color: var(--clr-blue); }
    .stat-pill--amber .stat-pill__icon { background: var(--clr-amber-light); color: var(--clr-amber); }
    .stat-pill--red .stat-pill__icon { background: var(--clr-rose-light); color: var(--clr-rose); }
    .stat-pill--teal .stat-pill__icon { background: var(--clr-teal-light); color: var(--clr-teal); }
    .stat-pill__value {
      display: block;
      font-size: 1.35rem;
      font-weight: 800;
      line-height: 1;
      color: var(--clr-text);
    }
    .stat-pill__label {
      display: block;
      font-size: .72rem;
      color: var(--clr-text-muted);
      margin-top: .1rem;
    }

    /* ═══════════════════════════════════════════════
       HEARING GLASS
       ═══════════════════════════════════════════════ */
    .hearing-glass {
      position: relative;
      background: linear-gradient(135deg, #0f2d5e, #1a3a6e);
      border-radius: var(--radius-xl);
      padding: 1.25rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.25rem;
      margin-bottom: 1.25rem;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(15,45,94,.2);
    }
    .hearing-glass__glow {
      position: absolute;
      top: -30%;
      left: -5%;
      width: 160px;
      height: 160px;
      background: radial-gradient(circle, rgba(234,63,72,.15) 0%, transparent 70%);
      pointer-events: none;
    }
    .hearing-glass__body { position: relative; z-index: 1; flex: 1; }
    .hearing-glass__tag {
      display: inline-flex;
      align-items: center;
      gap: .3rem;
      font-size: .65rem;
      font-weight: 700;
      color: #99f6e4;
      text-transform: uppercase;
      letter-spacing: .3px;
    }
    .hearing-glass__tag svg { width: 13px; height: 13px; }
    .hearing-glass__body h2 {
      font-size: 1.15rem;
      font-weight: 800;
      color: white;
      margin: .25rem 0 .2rem;
    }
    .hearing-glass__loc {
      display: flex;
      align-items: center;
      gap: .3rem;
      font-size: .78rem;
      color: rgba(255,255,255,.55);
      margin: 0;
    }
    .hearing-glass__loc svg { width: 14px; height: 14px; }
    .hearing-glass__date {
      position: relative;
      z-index: 1;
      background: rgba(255,255,255,.08);
      backdrop-filter: blur(6px);
      border: 1px solid rgba(255,255,255,.1);
      border-radius: var(--radius-md);
      padding: .5rem 1rem;
      text-align: center;
    }
    .hearing-glass__day {
      display: block;
      font-size: .9rem;
      font-weight: 800;
      color: white;
      font-family: 'SF Mono', 'Fira Code', monospace;
    }
    .hearing-glass__time {
      display: block;
      font-size: .65rem;
      color: #99f6e4;
      margin-top: .05rem;
    }

    /* ═══════════════════════════════════════════════
       MAIN GRID
       ═══════════════════════════════════════════════ */
    .main-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    /* ═══════════════════════════════════════════════
       CARD SHELL
       ═══════════════════════════════════════════════ */
    .card {
      background: var(--clr-surface);
      border: 1px solid var(--clr-border);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-card);
      overflow: hidden;
    }
    .card__head {
      display: flex;
      align-items: center;
      gap: .55rem;
      padding: .9rem 1.1rem .65rem;
    }
    .card__head--with-action {
      justify-content: space-between;
      align-items: center;
      gap: .75rem;
      flex-wrap: wrap;
    }
    .card__head-main {
      display: flex;
      align-items: center;
      gap: .55rem;
      min-width: 0;
    }
    .card__action-link {
      font-size: .72rem;
      font-weight: 700;
      color: var(--clr-teal);
      text-decoration: none;
      white-space: nowrap;
    }
    .card__action-link:hover { text-decoration: underline; }
    .card__icon {
      width: 30px;
      height: 30px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .card__icon svg { width: 16px; height: 16px; }
    .card__icon--teal { background: var(--clr-teal-light); color: var(--clr-teal); }
    .card__icon--indigo { background: var(--clr-indigo-light); color: var(--clr-indigo); }
    .card__icon--amber { background: var(--clr-amber-light); color: var(--clr-amber); }
    .card__icon--rose { background: var(--clr-rose-light); color: var(--clr-rose); }
    .card__head h3 {
      font-size: .88rem;
      font-weight: 700;
      margin: 0;
      color: var(--clr-text);
    }
    .card__body { padding: 0 1.1rem .85rem; }

    /* ═══════════════════════════════════════════════
       EVENT ITEM
       ═══════════════════════════════════════════════ */
    .event-item {
      display: flex;
      align-items: flex-start;
      gap: .65rem;
      padding: .6rem 0;
      border-bottom: 1px solid var(--clr-border);
    }
    .event-item:last-child { border-bottom: none; }
    .event-item__bar {
      width: 3px;
      min-height: 32px;
      border-radius: 2px;
      flex-shrink: 0;
    }
    .event-item__bar--hearing { background: var(--clr-brand); }
    .event-item__bar--appointment { background: var(--clr-blue); }
    .event-item__bar--deadline { background: var(--clr-amber); }
    .event-item__bar--meeting { background: #22c55e; }
    .event-item__bar--training { background: #8b5cf6; }
    .event-item__meta {
      display: flex;
      align-items: center;
      gap: .35rem;
      margin-bottom: .15rem;
    }
    .event-item__time {
      font-size: .65rem;
      font-family: 'SF Mono', 'Fira Code', monospace;
      background: var(--clr-bg);
      border: 1px solid var(--clr-border);
      padding: .08rem .3rem;
      border-radius: 4px;
      color: var(--clr-text-secondary);
    }
    .event-item__type {
      font-size: .58rem;
      font-weight: 700;
      padding: .08rem .4rem;
      border-radius: 6px;
    }
    .event-item__type--hearing { background: #fef2f2; color: var(--clr-brand); }
    .event-item__type--appointment { background: #eff6ff; color: var(--clr-blue); }
    .event-item__type--deadline { background: #fffbeb; color: var(--clr-amber); }
    .event-item__type--meeting { background: #f0fdf4; color: #22c55e; }
    .event-item__type--training { background: #faf5ff; color: #8b5cf6; }
    .event-item__urgent { display: flex; color: #f97316; }
    .event-item__urgent svg { width: 12px; height: 12px; }
    .event-item__title {
      font-size: .78rem;
      font-weight: 600;
      margin: 0;
      color: var(--clr-text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* ═══════════════════════════════════════════════
       CASE ITEM
       ═══════════════════════════════════════════════ */
    .case-item {
      padding: .6rem 0;
      border-bottom: 1px solid var(--clr-border);
      cursor: pointer;
      border-radius: var(--radius-sm);
      margin: 0 -.35rem;
      padding-left: .35rem;
      padding-right: .35rem;
      transition: background var(--transition);
    }
    .case-item:hover { background: var(--clr-bg); }
    .case-item:focus-visible {
      outline: 2px solid var(--clr-teal);
      outline-offset: 2px;
    }
    .case-item--selected {
      background: #f0fdfa;
      border-bottom-color: transparent;
    }
    .case-item:last-child { border-bottom: none; }
    .case-item__top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: .4rem;
      margin-bottom: .3rem;
    }
    .case-item__num {
      font-size: .65rem;
      color: var(--clr-text-muted);
      font-family: 'SF Mono', 'Fira Code', monospace;
    }
    .case-item__name {
      font-size: .78rem;
      font-weight: 600;
      margin: .05rem 0 0;
      color: var(--clr-text);
    }
    .case-item__status {
      font-size: .58rem;
      font-weight: 700;
      padding: .12rem .4rem;
      border-radius: 6px;
      white-space: nowrap;
    }
    .case-item__status--active { background: #f0fdfa; color: var(--clr-teal); }
    .case-item__status--pending { background: #fffbeb; color: var(--clr-amber); }
    .case-item__status--urgent { background: #fef2f2; color: var(--clr-brand); }
    .case-item__status--closed { background: var(--clr-bg); color: var(--clr-text-muted); }
    .case-item__progress {
      display: flex;
      align-items: center;
      gap: .4rem;
    }
    .case-item__track {
      flex: 1;
      height: 4px;
      background: var(--clr-bg);
      border-radius: 2px;
      overflow: hidden;
    }
    .case-item__fill {
      height: 100%;
      background: linear-gradient(90deg, var(--clr-teal), #14b8a6);
      border-radius: 2px;
      transition: width .4s cubic-bezier(.4,0,.2,1);
    }
    .case-item__pct {
      font-size: .65rem;
      font-weight: 700;
      color: var(--clr-text-muted);
      min-width: 28px;
      text-align: left;
    }

    /* ═══════════════════════════════════════════════
       FEES
       ═══════════════════════════════════════════════ */
    .fees-overview { padding: .2rem 0; }
    .fees-overview__row {
      display: flex;
      justify-content: space-between;
      padding: .35rem 0;
      font-size: .8rem;
    }
    .fees-overview__row span { color: var(--clr-text-secondary); }
    .fees-overview__row strong { color: var(--clr-text); }
    .fees-overview__row strong small {
      font-size: .65rem;
      font-weight: 500;
      color: var(--clr-text-muted);
    }
    .fees-overview__row--paid strong { color: #16a34a; }
    .fees-overview__row--remaining strong { color: var(--clr-amber); }
    .fees-ring { margin: .4rem 0 .6rem; }
    .fees-ring__labels {
      display: flex;
      justify-content: space-between;
      font-size: .65rem;
      color: var(--clr-text-muted);
      margin-bottom: .25rem;
    }
    .fees-ring__track {
      height: 5px;
      background: var(--clr-bg);
      border-radius: 3px;
      overflow: hidden;
    }
    .fees-ring__fill {
      height: 100%;
      background: linear-gradient(90deg, var(--clr-teal), #14b8a6);
      border-radius: 3px;
      transition: width .4s cubic-bezier(.4,0,.2,1);
    }
    .fees-detail {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: .4rem 0;
      border-top: 1px solid var(--clr-border);
      font-size: .78rem;
    }
    .fees-detail__client { font-weight: 500; color: var(--clr-text-secondary); }
    .fees-detail__amounts b { color: #16a34a; font-weight: 700; }
    .fees-detail__amounts span { color: var(--clr-text-muted); font-size: .7rem; }

    /* ═══════════════════════════════════════════════
       NOTIFICATIONS
       ═══════════════════════════════════════════════ */
    .notif-item {
      display: flex;
      align-items: flex-start;
      gap: .55rem;
      padding: .55rem;
      border-radius: var(--radius-sm);
      margin-bottom: .35rem;
    }
    .notif-item--high { background: #fef2f2; }
    .notif-item--medium { background: #fffbeb; }
    .notif-item--info { background: #eff6ff; }
    .notif-item__pulse {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      margin-top: .3rem;
      flex-shrink: 0;
    }
    .notif-item__pulse--high { background: var(--clr-brand); }
    .notif-item__pulse--medium { background: var(--clr-amber); }
    .notif-item__pulse--info { background: var(--clr-blue); }
    .notif-item__content { flex: 1; min-width: 0; }
    .notif-item__title {
      font-size: .75rem;
      font-weight: 700;
      margin: 0;
      color: var(--clr-text);
    }
    .notif-item__msg {
      font-size: .68rem;
      color: var(--clr-text-secondary);
      margin: .1rem 0 0;
      line-height: 1.4;
    }

    /* ═══════════════════════════════════════════════
       RESPONSIVE
       ═══════════════════════════════════════════════ */
    @media (max-width: 1024px) {
      .main-grid { grid-template-columns: 1fr; }
      .stats-row { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 640px) {
      .stats-row { grid-template-columns: 1fr; }
      .hearing-glass { flex-direction: column; text-align: center; }
    }
  `],
})
export class DashboardPage implements OnInit {
  auth = inject(AuthService);
  private translation = inject(TranslationService);
  private casesState = inject(CasesStateService);
  private clientsState = inject(ClientsStateService);
  private notificationsState = inject(NotificationsStateService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  readonly selectedCase = toSignal(this.casesState.selectSelectedCase(), {
    initialValue: null as Case | null,
  });

  /** Same dossiers as الجلسات / المالية ({@link CasesStateService}). */
  private casesList = toSignal(this.casesState.selectCases(), { initialValue: [] as Case[] });

  private clientsList = toSignal(this.clientsState.clients$, { initialValue: [] as Client[] });

  private notificationList = toSignal(this.notificationsState.selectNotifications(), {
    initialValue: [] as Notification[],
  });

  activeCasesCount = computed(() => this.casesList().filter(c => c.status === 'active').length);
  pendingCasesCount = computed(() => this.casesList().filter(c => c.status === 'pending').length);
  activeCasesList = computed(() =>
    this.casesList().filter(c => c.status === 'active' || c.status === 'urgent')
  );

  /** أتعاب مجمّعة من حقول الملفات (`fees` / `paidFees`) — نفس مصدر القائمة. */
  totalFees = computed(() => this.casesList().reduce((s, c) => s + (c.fees ?? 0), 0));
  totalPaid = computed(() => this.casesList().reduce((s, c) => s + (c.paidFees ?? 0), 0));
  remainingFees = computed(() => Math.max(0, this.totalFees() - this.totalPaid()));
  collectionPercent = computed(() => {
    const t = this.totalFees();
    return t > 0 ? Math.round((this.totalPaid() / t) * 100) : 0;
  });

  feesDetailRows = computed(() =>
    [...this.casesList()]
      .filter(c => (c.fees ?? 0) > 0)
      .sort((a, b) => (b.fees ?? 0) - (a.fees ?? 0))
      .slice(0, 6)
      .map(c => ({ id: c.id, client: c.clientName, total: c.fees, paid: c.paidFees }))
  );

  private agendaFromCases = computed(() => agendaEventsFromCases(this.casesList()));

  weekEvents = computed(() => this.agendaFromCases().slice(0, 5));

  nextHearing = computed((): AgendaEvent | null => {
    const events = this.agendaFromCases();
    if (events.length === 0) return null;
    const t = todayIsoDate();
    return events.find(e => e.date >= t) ?? events[0];
  });

  urgentNotifCount = computed(
    () => this.notificationList().filter(n => n.priority === 'high' && !n.read).length
  );

  totalClients = computed(() => this.clientsList().length);

  recentNotifs = computed(() => this.notificationList().slice(0, 3));

  today = new Date().toLocaleDateString('ar-TN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  eventTypeLabels: Record<string, string> = {
    hearing: 'جلسة',
    appointment: 'موعد',
    deadline: 'أجل',
    meeting: 'اجتماع',
    training: 'تكوين',
  };

  caseStatusLabels: Record<string, string> = {
    active: 'نشط',
    pending: 'معلق',
    urgent: 'عاجل',
    closed: 'منجز',
  };

  t(key: string): string {
    return this.translation.t(key);
  }

  /** Stable `?case=` for router links (template cannot use `{ [key]: id }`). */
  caseDeepLinkParams(caseId: number): Record<string, number> {
    return { [WORKSPACE_QUERY.CASE_ID]: caseId };
  }

  ngOnInit(): void {
    this.notificationsState.loadNotifications();

    this.clientsState.clients$.pipe(take(1)).subscribe(clients => {
      if (clients.length === 0) this.clientsState.loadClients();
    });

    this.casesState
      .selectCases()
      .pipe(take(1))
      .subscribe(cases => {
        if (cases.length === 0) this.casesState.loadCases();
      });

    this.route.queryParams
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        distinctUntilChanged(
          (a, b) =>
            String(a[WORKSPACE_QUERY.CASE_ID] ?? '') === String(b[WORKSPACE_QUERY.CASE_ID] ?? '')
        )
      )
      .subscribe(params => {
        const raw = params[WORKSPACE_QUERY.CASE_ID];
        if (raw == null || raw === '') {
          return;
        }
        const id = Number(raw);
        if (Number.isFinite(id) && id > 0) {
          this.casesState.loadCase(id);
        }
      });

    /** Mirror global dossier selection into `?case=` when arriving without it (same idea as الجلسات). */
    combineLatest([this.route.queryParams, this.casesState.selectSelectedCase()])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([params, selected]) => {
        const raw = params[WORKSPACE_QUERY.CASE_ID];
        if ((raw == null || raw === '') && selected != null) {
          void this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { [WORKSPACE_QUERY.CASE_ID]: selected.id },
            queryParamsHandling: 'merge',
            replaceUrl: true,
          });
        }
      });
  }

  onCaseRowClick(case_: Case): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [WORKSPACE_QUERY.CASE_ID]: case_.id },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  clearSelectedCase(): void {
    this.casesState.clearSelection();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [WORKSPACE_QUERY.CASE_ID]: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  logout(): void {
    this.auth.logout();
  }
}
