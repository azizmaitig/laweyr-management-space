import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Client, Communication, Case } from '../../../../core/models';

type ClientTab = 'identity' | 'cases' | 'financial' | 'communications' | 'notes';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (client(); as client) {
      <div class="client-detail">
        <!-- Header -->
        <header class="client-detail__header">
          <div class="client-detail__header-info">
            <div class="client-detail__avatar" aria-hidden="true">{{ getInitials(client.name) }}</div>
            <div class="client-detail__header-text">
              <h1>{{ client.name }}</h1>
              <div class="client-detail__header-meta">
                @if (client.cin) { <span class="client-detail__badge">CIN: {{ client.cin }}</span> }
                @if (client.cases) { <span class="client-detail__badge client-detail__badge--cases">{{ client.cases.length }} ملف</span> }
                @if (lastContactDate()) {
                  <span class="client-detail__badge" [class.client-detail__badge--warning]="isContactOverdue()">
                    آخر تواصل: {{ lastContactDate() }}
                    @if (isContactOverdue()) { ⚠️ }
                  </span>
                }
              </div>
            </div>
          </div>
          <div class="client-detail__header-actions">
            <button class="client-detail__action-btn" (click)="updateRequested.emit(client)" aria-label="تعديل معلومات العميل">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              تعديل
            </button>
          </div>
        </header>

        <!-- Tabs -->
        <nav class="client-detail__tabs" role="tablist" aria-label="أقسام العميل">
          @for (tab of tabs; track tab.id) {
            <button
              class="client-detail__tab"
              [class.client-detail__tab--active]="activeTab() === tab.id"
              (click)="activeTab.set(tab.id)"
              role="tab"
              [attr.aria-selected]="activeTab() === tab.id"
              [attr.aria-controls]="'panel-' + tab.id">
              <span class="client-detail__tab-icon" aria-hidden="true">{{ tab.icon }}</span>
              <span class="client-detail__tab-label">{{ tab.label }}</span>
              @if (getTabBadge(tab.id)) {
                <span class="client-detail__tab-badge">{{ getTabBadge(tab.id) }}</span>
              }
            </button>
          }
        </nav>

        <!-- Tab Panels -->
        <div class="client-detail__content">
          <!-- Identity Panel -->
          @if (activeTab() === 'identity') {
            <div id="panel-identity" class="client-detail__panel" role="tabpanel">
              <div class="client-detail__card">
                <h3 class="client-detail__card-title">معلومات الاتصال</h3>
                <div class="client-detail__info-grid">
                  @if (client.address) {
                    <div class="client-detail__info-item">
                      <span class="client-detail__info-icon" aria-hidden="true">📍</span>
                      <div class="client-detail__info-content">
                        <span class="client-detail__info-label">العنوان</span>
                        <span class="client-detail__info-value">{{ client.address }}</span>
                      </div>
                    </div>
                  }
                  <div class="client-detail__info-item">
                    <span class="client-detail__info-icon" aria-hidden="true">📞</span>
                    <div class="client-detail__info-content">
                      <span class="client-detail__info-label">الهاتف</span>
                      <span class="client-detail__info-value" dir="ltr">{{ client.phone }}</span>
                    </div>
                  </div>
                  @if (client.email) {
                    <div class="client-detail__info-item">
                      <span class="client-detail__info-icon" aria-hidden="true">✉️</span>
                      <div class="client-detail__info-content">
                        <span class="client-detail__info-label">البريد الإلكتروني</span>
                        <span class="client-detail__info-value" dir="ltr">{{ client.email }}</span>
                      </div>
                    </div>
                  }
                  @if (client.notes) {
                    <div class="client-detail__info-item client-detail__info-item--full">
                      <span class="client-detail__info-icon" aria-hidden="true">📝</span>
                      <div class="client-detail__info-content">
                        <span class="client-detail__info-label">ملاحظات</span>
                        <span class="client-detail__info-value client-detail__info-value--multiline">{{ client.notes }}</span>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>
          }

          <!-- Cases Panel -->
          @if (activeTab() === 'cases') {
            <div id="panel-cases" class="client-detail__panel" role="tabpanel">
              <div class="client-detail__card">
                <h3 class="client-detail__card-title">سجل الملفات</h3>
                @if (client.cases && client.cases.length > 0) {
                  <div class="client-detail__cases-list">
                    @for (case_ of client.cases; track case_.id) {
                      <div class="client-detail__case-item">
                        <div class="client-detail__case-icon" [class]="'client-detail__case-icon--' + case_.type" aria-hidden="true">
                          @if (case_.type === 'civil') { ⚖️ }
                          @else if (case_.type === 'penal') { 🔒 }
                          @else if (case_.type === 'commercial') { 💼 }
                          @else if (case_.type === 'family') { 👨‍👩‍👧 }
                          @else { 📋 }
                        </div>
                        <div class="client-detail__case-info">
                          <div class="client-detail__case-head">
                            <span class="client-detail__case-num">{{ case_.number || '#' + case_.id }}</span>
                            <span class="client-detail__case-status" [class]="'client-detail__case-status--' + case_.status">{{ getStatusLabel(case_.status) }}</span>
                          </div>
                          <span class="client-detail__case-title">{{ case_.title }}</span>
                          <div class="client-detail__case-meta">
                            @if (case_.court) {
                              <span class="client-detail__case-meta-item">🏛️ {{ case_.court }}</span>
                            }
                            @if (case_.hearingDate) {
                              <span class="client-detail__case-meta-item">📅 {{ case_.hearingDate }}</span>
                            }
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <p class="client-detail__empty">لا توجد ملفات لهذا العميل</p>
                }
              </div>
            </div>
          }

          <!-- Financial Panel -->
          @if (activeTab() === 'financial') {
            <div id="panel-financial" class="client-detail__panel" role="tabpanel">
              <div class="client-detail__card">
                <h3 class="client-detail__card-title">الملخص المالي</h3>
                @if (client.financial) {
                  <div class="client-detail__financial">
                    <div class="client-detail__financial-card client-detail__financial-card--paid">
                      <span class="client-detail__financial-label">المبلغ المدفوع</span>
                      <span class="client-detail__financial-value">{{ client.financial.paid | number:'1.0-0' }} د.ت</span>
                    </div>
                    <div class="client-detail__financial-card client-detail__financial-card--remaining">
                      <span class="client-detail__financial-label">المبلغ المتبقي</span>
                      <span class="client-detail__financial-value">{{ client.financial.remaining | number:'1.0-0' }} د.ت</span>
                    </div>
                  </div>
                  @let total = client.financial.paid + client.financial.remaining;
                  @if (total > 0) {
                    <div class="client-detail__progress">
                      <div class="client-detail__progress-bar">
                        <div class="client-detail__progress-fill" [style.width.%]="(client.financial.paid / total) * 100"></div>
                      </div>
                      <span class="client-detail__progress-label">{{ ((client.financial.paid / total) * 100) | number:'1.0-0' }}% مدفوع</span>
                    </div>
                  }
                } @else {
                  <p class="client-detail__empty">لا توجد بيانات مالية</p>
                }
              </div>
            </div>
          }

          <!-- Communications Panel -->
          @if (activeTab() === 'communications') {
            <div id="panel-communications" class="client-detail__panel" role="tabpanel">
              <div class="client-detail__card">
                <div class="client-detail__card-header">
                  <h3 class="client-detail__card-title">سجل التواصل</h3>
                  <button class="client-detail__add-btn" (click)="addCommunicationRequested.emit(client.id)" aria-label="إضافة تواصل جديد">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    إضافة
                  </button>
                </div>
                @if (communications(); as comms) {
                  @if (comms.length > 0) {
                    <div class="client-detail__comms-list">
                      @for (comm of comms; track comm.id) {
                        <div class="client-detail__comm-item">
                          <div class="client-detail__comm-icon" [class]="'client-detail__comm-icon--' + comm.type" aria-hidden="true">
                            @if (comm.type === 'CALL') {
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                            } @else if (comm.type === 'EMAIL') {
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                            } @else if (comm.type === 'MESSAGE') {
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            } @else {
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            }
                          </div>
                          <div class="client-detail__comm-info">
                            <div class="client-detail__comm-head">
                              <span class="client-detail__comm-type">{{ getCommunicationTypeLabel(comm.type) }}</span>
                              <span class="client-detail__comm-date">{{ comm.date }}</span>
                            </div>
                            @if (comm.note) {
                              <p class="client-detail__comm-note">{{ comm.note }}</p>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  } @else {
                    <p class="client-detail__empty">لا توجد تواصلات</p>
                  }
                }
              </div>
            </div>
          }

          <!-- Notes Panel -->
          @if (activeTab() === 'notes') {
            <div id="panel-notes" class="client-detail__panel" role="tabpanel">
              <div class="client-detail__card">
                <h3 class="client-detail__card-title">ملاحظات المحامي</h3>
                @if (client.notes) {
                  <div class="client-detail__notes-content" [innerHTML]="client.notes"></div>
                } @else {
                  <p class="client-detail__empty">لا توجد ملاحظات</p>
                }
              </div>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .client-detail { display: flex; flex-direction: column; gap: 0; }

    /* Header */
    .client-detail__header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-6); background: var(--clr-white); border: 1px solid var(--clr-border); border-radius: var(--radius-lg) var(--radius-lg) 0 0; }
    .client-detail__header-info { display: flex; align-items: center; gap: var(--space-4); }
    .client-detail__avatar { width: 64px; height: 64px; border-radius: var(--radius-lg); background: linear-gradient(135deg, var(--clr-accent-green), #14b8a6); color: white; display: flex; align-items: center; justify-content: center; font-size: var(--text-2xl); font-weight: var(--font-bold); flex-shrink: 0; }
    .client-detail__header-text h1 { font-size: var(--text-xl); font-weight: var(--font-bold); color: var(--clr-secondary); margin: 0; }
    .client-detail__header-meta { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-top: var(--space-1); }
    .client-detail__badge { font-size: var(--text-xs); font-weight: var(--font-semibold); padding: var(--space-1) var(--space-2); border-radius: var(--radius-sm); background: var(--clr-secondary-light); color: var(--clr-text-secondary); }
    .client-detail__badge--cases { background: var(--clr-accent-blue-light); color: var(--clr-accent-blue); }
    .client-detail__badge--warning { background: var(--clr-accent-amber-light); color: var(--clr-accent-amber); }
    .client-detail__header-actions { display: flex; gap: var(--space-2); }
    .client-detail__action-btn { display: inline-flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-4); border: 1px solid var(--clr-border); border-radius: var(--radius-sm); background: transparent; color: var(--clr-text-secondary); font-size: var(--text-sm); font-weight: var(--font-semibold); cursor: pointer; transition: all var(--transition-fast); }
    .client-detail__action-btn:hover { border-color: var(--clr-primary); color: var(--clr-primary); }
    .client-detail__action-btn svg { width: 14px; height: 14px; }

    /* Tabs */
    .client-detail__tabs { display: flex; gap: 0; background: var(--clr-secondary-light); border-bottom: 1px solid var(--clr-border); overflow-x: auto; }
    .client-detail__tab { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-3) var(--space-5); border: none; background: transparent; color: var(--clr-text-muted); font-size: var(--text-sm); font-weight: var(--font-semibold); cursor: pointer; transition: all var(--transition-fast); white-space: nowrap; position: relative; }
    .client-detail__tab:hover { color: var(--clr-secondary); background: rgba(255,255,255,0.5); }
    .client-detail__tab--active { color: var(--clr-secondary); background: var(--clr-white); }
    .client-detail__tab--active::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: var(--clr-primary); }
    .client-detail__tab-icon { font-size: 1rem; }
    .client-detail__tab-label { }
    .client-detail__tab-badge { font-size: var(--text-xs); font-weight: var(--font-bold); padding: var(--space-1) var(--space-2); border-radius: var(--radius-full); background: var(--clr-primary-light); color: var(--clr-primary); }

    /* Content */
    .client-detail__content { padding: var(--space-6); background: var(--clr-secondary-light); min-height: 400px; }
    .client-detail__panel { }

    /* Cards */
    .client-detail__card { background: var(--clr-white); border: 1px solid var(--clr-border); border-radius: var(--radius-lg); padding: var(--space-5); }
    .client-detail__card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }
    .client-detail__card-title { font-size: var(--text-lg); font-weight: var(--font-bold); color: var(--clr-secondary); margin: 0 0 var(--space-4); }

    /* Info Grid */
    .client-detail__info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-4); }
    .client-detail__info-item { display: flex; gap: var(--space-3); }
    .client-detail__info-item--full { grid-column: 1 / -1; }
    .client-detail__info-icon { font-size: 1.25rem; flex-shrink: 0; }
    .client-detail__info-content { display: flex; flex-direction: column; gap: var(--space-1); }
    .client-detail__info-label { font-size: var(--text-sm); font-weight: var(--font-semibold); color: var(--clr-text-muted); }
    .client-detail__info-value { font-size: var(--text-base); color: var(--clr-secondary); }
    .client-detail__info-value--multiline { white-space: pre-wrap; line-height: var(--leading-relaxed); }

    /* Cases List */
    .client-detail__cases-list { display: flex; flex-direction: column; gap: var(--space-2); }
    .client-detail__case-item { display: flex; gap: var(--space-3); padding: var(--space-4); border: 1px solid var(--clr-border); border-radius: var(--radius-md); transition: all var(--transition-fast); }
    .client-detail__case-item:hover { box-shadow: var(--shadow-sm); border-color: var(--clr-primary); }
    .client-detail__case-icon { font-size: 1.5rem; flex-shrink: 0; }
    .client-detail__case-info { flex: 1; }
    .client-detail__case-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-1); }
    .client-detail__case-num { font-size: var(--text-sm); font-weight: var(--font-bold); color: var(--clr-secondary); font-family: monospace; }
    .client-detail__case-status { font-size: var(--text-xs); font-weight: var(--font-bold); padding: var(--space-1) var(--space-2); border-radius: var(--radius-sm); }
    .client-detail__case-status--active { background: var(--clr-accent-green-light); color: var(--clr-accent-green); }
    .client-detail__case-status--pending { background: var(--clr-accent-amber-light); color: var(--clr-accent-amber); }
    .client-detail__case-status--urgent { background: var(--clr-primary-light); color: var(--clr-error); }
    .client-detail__case-status--closed { background: var(--clr-secondary-light); color: var(--clr-text-muted); }
    .client-detail__case-title { display: block; font-size: var(--text-sm); color: var(--clr-text-secondary); margin-bottom: var(--space-1); }
    .client-detail__case-meta { display: flex; flex-wrap: wrap; gap: var(--space-3); font-size: var(--text-xs); color: var(--clr-text-muted); }
    .client-detail__case-meta-item { display: inline-flex; align-items: center; gap: var(--space-1); }

    /* Financial */
    .client-detail__financial { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-4); margin-bottom: var(--space-5); }
    .client-detail__financial-card { padding: var(--space-4); border-radius: var(--radius-md); text-align: center; }
    .client-detail__financial-card--paid { background: var(--clr-accent-green-light); }
    .client-detail__financial-card--remaining { background: var(--clr-accent-amber-light); }
    .client-detail__financial-label { display: block; font-size: var(--text-sm); color: var(--clr-text-muted); margin-bottom: var(--space-1); }
    .client-detail__financial-value { display: block; font-size: var(--text-xl); font-weight: var(--font-bold); }
    .client-detail__financial-card--paid .client-detail__financial-value { color: var(--clr-accent-green); }
    .client-detail__financial-card--remaining .client-detail__financial-value { color: var(--clr-accent-amber); }
    .client-detail__progress { display: flex; align-items: center; gap: var(--space-3); }
    .client-detail__progress-bar { flex: 1; height: 8px; background: var(--clr-secondary-light); border-radius: var(--radius-full); overflow: hidden; }
    .client-detail__progress-fill { height: 100%; background: linear-gradient(90deg, var(--clr-accent-green), #14b8a6); border-radius: var(--radius-full); transition: width var(--transition); }
    .client-detail__progress-label { font-size: var(--text-sm); font-weight: var(--font-semibold); color: var(--clr-text-muted); white-space: nowrap; }

    /* Communications List */
    .client-detail__comms-list { display: flex; flex-direction: column; gap: var(--space-2); }
    .client-detail__comm-item { display: flex; gap: var(--space-3); padding: var(--space-4); border: 1px solid var(--clr-border); border-radius: var(--radius-md); }
    .client-detail__comm-icon { width: 40px; height: 40px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .client-detail__comm-icon svg { width: 20px; height: 20px; }
    .client-detail__comm-icon--CALL { background: var(--clr-accent-green-light); color: var(--clr-accent-green); }
    .client-detail__comm-icon--EMAIL { background: var(--clr-accent-blue-light); color: var(--clr-accent-blue); }
    .client-detail__comm-icon--MESSAGE { background: var(--clr-accent-purple-light); color: var(--clr-accent-purple); }
    .client-detail__comm-icon--APPOINTMENT { background: var(--clr-accent-amber-light); color: var(--clr-accent-amber); }
    .client-detail__comm-info { flex: 1; }
    .client-detail__comm-head { display: flex; justify-content: space-between; align-items: center; gap: var(--space-2); margin-bottom: var(--space-1); }
    .client-detail__comm-type { font-size: var(--text-sm); font-weight: var(--font-semibold); color: var(--clr-secondary); }
    .client-detail__comm-date { font-size: var(--text-xs); color: var(--clr-text-muted); }
    .client-detail__comm-note { font-size: var(--text-sm); color: var(--clr-text-secondary); margin: 0; line-height: var(--leading-relaxed); }

    /* Add Button */
    .client-detail__add-btn { display: inline-flex; align-items: center; gap: var(--space-1); padding: var(--space-2) var(--space-4); border: 1px solid var(--clr-border); border-radius: var(--radius-sm); background: transparent; color: var(--clr-text-secondary); font-size: var(--text-sm); font-weight: var(--font-semibold); cursor: pointer; transition: all var(--transition-fast); }
    .client-detail__add-btn:hover { border-color: var(--clr-primary); color: var(--clr-primary); }
    .client-detail__add-btn svg { width: 14px; height: 14px; }

    /* Empty State */
    .client-detail__empty { font-size: var(--text-sm); color: var(--clr-text-muted); text-align: center; padding: var(--space-8); }

    /* Notes Content */
    .client-detail__notes-content { font-size: var(--text-base); line-height: var(--leading-relaxed); color: var(--clr-text-secondary); }
    .client-detail__notes-content :first-child { margin-top: 0; }
    .client-detail__notes-content :last-child { margin-bottom: 0; }

    /* Mobile */
    @media (max-width: 767px) {
      .client-detail__header { flex-direction: column; align-items: flex-start; gap: var(--space-4); }
      .client-detail__header-actions { align-self: flex-end; }
      .client-detail__tabs { overflow-x: auto; }
      .client-detail__tab { padding: var(--space-3) var(--space-4); }
      .client-detail__tab-label { display: none; }
      .client-detail__content { padding: var(--space-4); }
      .client-detail__info-grid { grid-template-columns: 1fr; }
      .client-detail__financial { grid-template-columns: 1fr; }
      .client-detail__comm-item { flex-direction: column; }
      .client-detail__comm-icon { width: 36px; height: 36px; }
    }
  `],
})
export class ClientDetailComponent {
  client = input.required<Client | null>();
  communications = input<Communication[]>([]);
  lastContactDate = input<string>('');
  updateRequested = output<Client>();
  addCommunicationRequested = output<number>();

  activeTab = signal<ClientTab>('identity');

  tabs: { id: ClientTab; label: string; icon: string; badge?: string | undefined }[] = [
    { id: 'identity', label: 'الهوية', icon: '👤' },
    { id: 'cases', label: 'الملفات', icon: '📁' },
    { id: 'financial', label: 'المالية', icon: '💰' },
    { id: 'communications', label: 'التواصل', icon: '📞' },
    { id: 'notes', label: 'الملاحظات', icon: '📝' },
  ];

  getTabBadge(tabId: ClientTab): string | undefined {
    const client = this.client();
    if (!client) return undefined;
    if (tabId === 'cases') return client.cases?.length?.toString();
    if (tabId === 'communications') return this.communications()?.length?.toString();
    return undefined;
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  getCommunicationTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      CALL: 'مكالمة هاتفية',
      EMAIL: 'بريد إلكتروني',
      MESSAGE: 'رسالة',
      APPOINTMENT: 'موعد',
    };
    return labels[type] || type;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'نشط',
      pending: 'معلق',
      urgent: 'عاجل',
      closed: 'مغلق',
    };
    return labels[status] || status;
  }

  isContactOverdue(): boolean {
    const lastDate = this.lastContactDate();
    if (!lastDate) return false;
    const daysSinceContact = Math.floor((Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceContact > 30; // Overdue if no contact for 30 days
  }
}
