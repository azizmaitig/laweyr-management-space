import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CaseTimelineEvent } from '../../../../core/models';

type TimelineFilter = 'all' | 'case' | 'task' | 'document' | 'note' | 'hearing' | 'payment';

@Component({
  selector: 'app-timeline-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="timeline" role="list" [attr.aria-label]="'الجدول الزمني للملف'">
      <!-- Header with Filters -->
      <header class="timeline__header">
        <div class="timeline__header-top">
          <h3 class="timeline__title">الجدول الزمني</h3>
          <span class="timeline__count">{{ filteredEvents().length }} حدث</span>
        </div>

        <!-- Search -->
        <div class="timeline__search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
            placeholder="بحث في الأحداث..."
            class="timeline__search-input"
            aria-label="بحث في الأحداث">
        </div>

        <!-- Filter Chips -->
        <div class="timeline__filters" role="group" aria-label="تصفية حسب النوع">
          @for (filter of filters; track filter.id) {
            <button
              class="timeline__filter-chip"
              [class.timeline__filter-chip--active]="activeFilter() === filter.id"
              (click)="activeFilter.set(filter.id)"
              [attr.aria-pressed]="activeFilter() === filter.id">
              <span class="timeline__filter-icon" aria-hidden="true">{{ filter.icon }}</span>
              <span class="timeline__filter-label">{{ filter.label }}</span>
            </button>
          }
        </div>
      </header>

      <!-- Timeline Content -->
      <div class="timeline__content">
        @if (filteredEvents().length === 0) {
          <div class="timeline__empty">
            @if (searchQuery() || activeFilter() !== 'all') {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <p>لا توجد نتائج</p>
              <button class="timeline__empty-btn" (click)="clearFilters()">مسح التصفية</button>
            } @else {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <p>لا توجد أحداث لهذا الملف</p>
            }
          </div>
        } @else {
          <!-- Grouped by Date -->
          @for (group of groupedEvents(); track group.date) {
            <div class="timeline__group">
              <div class="timeline__group-header">
                <span class="timeline__group-date">{{ group.date }}</span>
                <span class="timeline__group-count">{{ group.events.length }} حدث</span>
              </div>
              <div class="timeline__line" aria-hidden="true"></div>
              @for (event of group.events; track event.id; let last = $last) {
                <div class="timeline__event" role="listitem" [class.timeline__event--last]="last">
                  <div class="timeline__event-dot" [class]="'timeline__event-dot--' + event.type" [attr.aria-label]="getEventTypeLabel(event.type)" role="img"></div>
                  <div class="timeline__event-card">
                    <div class="timeline__event-card-head">
                      <div class="timeline__event-type-badge" [class]="'timeline__event-type-badge--' + event.type">
                        <span class="timeline__event-type-icon" aria-hidden="true">{{ getEventIcon(event.type) }}</span>
                        <span class="timeline__event-type-label">{{ getEventTypeLabel(event.type) }}</span>
                      </div>
                      @if (event.time) {
                        <span class="timeline__event-time">{{ event.time }}</span>
                      }
                    </div>
                    <h4 class="timeline__event-title">{{ event.title }}</h4>
                    @if (event.description) {
                      <p class="timeline__event-desc">{{ event.description }}</p>
                    }
                    @if (event.location || event.amount) {
                      <div class="timeline__event-meta">
                        @if (event.location) {
                          <span class="timeline__event-meta-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            {{ event.location }}
                          </span>
                        }
                        @if (event.amount) {
                          <span class="timeline__event-meta-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                            {{ event.amount | number:'1.0-0' }} د.ت
                          </span>
                        }
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .timeline { display: flex; flex-direction: column; }

    /* Header */
    .timeline__header { margin-bottom: var(--space-6); }
    .timeline__header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3); }
    .timeline__title { font-size: var(--text-lg); font-weight: var(--font-bold); color: var(--clr-secondary); margin: 0; }
    .timeline__count { font-size: var(--text-sm); color: var(--clr-text-muted); background: var(--clr-secondary-light); padding: var(--space-1) var(--space-3); border-radius: var(--radius-full); }

    /* Search */
    .timeline__search { position: relative; margin-bottom: var(--space-3); }
    .timeline__search svg { position: absolute; right: var(--space-3); top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: var(--clr-text-muted); pointer-events: none; }
    .timeline__search-input { width: 100%; padding: var(--space-2) var(--space-3) var(--space-2) var(--space-8); border: 1.5px solid var(--clr-border); border-radius: var(--radius-md); font-size: var(--text-sm); color: var(--clr-secondary); background: var(--clr-white); outline: none; transition: border-color var(--transition-fast); }
    .timeline__search-input::placeholder { color: var(--clr-text-muted); }
    .timeline__search-input:focus { border-color: var(--clr-primary); }

    /* Filter Chips */
    .timeline__filters { display: flex; flex-wrap: wrap; gap: var(--space-2); }
    .timeline__filter-chip { display: inline-flex; align-items: center; gap: var(--space-1); padding: var(--space-1) var(--space-3); border: 1px solid var(--clr-border); border-radius: var(--radius-full); background: var(--clr-white); color: var(--clr-text-secondary); font-size: var(--text-xs); font-weight: var(--font-semibold); cursor: pointer; transition: all var(--transition-fast); }
    .timeline__filter-chip:hover { border-color: var(--clr-primary); color: var(--clr-primary); }
    .timeline__filter-chip--active { background: var(--clr-primary-light); border-color: var(--clr-primary); color: var(--clr-primary); }
    .timeline__filter-icon { font-size: 0.85rem; }

    /* Content */
    .timeline__content { position: relative; }

    /* Date Groups */
    .timeline__group { margin-bottom: var(--space-6); }
    .timeline__group:last-child { margin-bottom: 0; }
    .timeline__group-header { display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-4); }
    .timeline__group-date { font-size: var(--text-sm); font-weight: var(--font-bold); color: var(--clr-secondary); background: var(--clr-white); border: 1px solid var(--clr-border); padding: var(--space-1) var(--space-3); border-radius: var(--radius-sm); white-space: nowrap; }
    .timeline__group-count { font-size: var(--text-xs); color: var(--clr-text-muted); }
    .timeline__line { position: absolute; right: 15px; top: 2.5rem; bottom: 0; width: 2px; background: var(--clr-border); }

    /* Events */
    .timeline__event { position: relative; padding: 0 0 var(--space-4) var(--space-8); }
    .timeline__event--last { padding-bottom: 0; }
    .timeline__event-dot { position: absolute; right: calc(-1 * var(--space-8) + 6px); top: var(--space-2); width: 20px; height: 20px; border-radius: var(--radius-full); border: 3px solid var(--clr-white); display: flex; align-items: center; justify-content: center; z-index: 1; box-shadow: 0 0 0 2px var(--clr-border); }
    .timeline__event-dot--case { background: var(--clr-primary); }
    .timeline__event-dot--task { background: var(--clr-accent-green); }
    .timeline__event-dot--document { background: var(--clr-accent-blue); }
    .timeline__event-dot--note { background: var(--clr-accent-purple); }
    .timeline__event-dot--hearing { background: var(--clr-accent-amber); }
    .timeline__event-dot--payment { background: var(--clr-accent-green); }

    /* Event Card */
    .timeline__event-card { background: var(--clr-white); border: 1px solid var(--clr-border); border-radius: var(--radius-lg); padding: var(--space-4); transition: all var(--transition); }
    .timeline__event-card:hover { box-shadow: var(--shadow-md); border-color: var(--clr-primary); }
    .timeline__event-card-head { display: flex; justify-content: space-between; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2); }

    /* Type Badge */
    .timeline__event-type-badge { display: inline-flex; align-items: center; gap: var(--space-1); padding: var(--space-1) var(--space-2); border-radius: var(--radius-sm); font-size: var(--text-xs); font-weight: var(--font-semibold); }
    .timeline__event-type-icon { font-size: 0.85rem; }
    .timeline__event-type-badge--case { background: var(--clr-primary-light); color: var(--clr-primary); }
    .timeline__event-type-badge--task { background: var(--clr-accent-green-light); color: var(--clr-accent-green); }
    .timeline__event-type-badge--document { background: var(--clr-accent-blue-light); color: var(--clr-accent-blue); }
    .timeline__event-type-badge--note { background: var(--clr-accent-purple-light); color: var(--clr-accent-purple); }
    .timeline__event-type-badge--hearing { background: var(--clr-accent-amber-light); color: var(--clr-accent-amber); }
    .timeline__event-type-badge--payment { background: var(--clr-accent-green-light); color: var(--clr-accent-green); }

    .timeline__event-time { font-size: var(--text-xs); color: var(--clr-text-muted); font-family: monospace; }
    .timeline__event-title { font-size: var(--text-md); font-weight: var(--font-semibold); color: var(--clr-secondary); margin: 0 0 var(--space-1); line-height: var(--leading-tight); }
    .timeline__event-desc { font-size: var(--text-sm); color: var(--clr-text-secondary); margin: 0 0 var(--space-2); line-height: var(--leading-relaxed); }

    /* Meta */
    .timeline__event-meta { display: flex; flex-wrap: wrap; gap: var(--space-3); padding-top: var(--space-2); border-top: 1px solid var(--clr-border); }
    .timeline__event-meta-item { display: inline-flex; align-items: center; gap: var(--space-1); font-size: var(--text-xs); color: var(--clr-text-muted); }
    .timeline__event-meta-item svg { width: 12px; height: 12px; }

    /* Empty State */
    .timeline__empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--space-16) var(--space-8); color: var(--clr-text-muted); text-align: center; }
    .timeline__empty svg { width: 48px; height: 48px; margin-bottom: var(--space-4); opacity: .35; }
    .timeline__empty p { font-size: var(--text-md); margin: 0 0 var(--space-4); }
    .timeline__empty-btn { padding: var(--space-2) var(--space-4); border: 1px solid var(--clr-border); border-radius: var(--radius-sm); background: var(--clr-white); color: var(--clr-text-secondary); font-size: var(--text-sm); font-weight: var(--font-semibold); cursor: pointer; transition: all var(--transition-fast); }
    .timeline__empty-btn:hover { border-color: var(--clr-primary); color: var(--clr-primary); }

    /* Tablet */
    @media (max-width: 1023px) {
      .timeline__line { right: 13px; }
      .timeline__event-dot { right: calc(-1 * var(--space-7) + 4px); width: 18px; height: 18px; }
    }

    /* Mobile */
    @media (max-width: 767px) {
      .timeline__header { margin-bottom: var(--space-4); }
      .timeline__filters { overflow-x: auto; flex-wrap: nowrap; padding-bottom: var(--space-2); }
      .timeline__filter-chip { white-space: nowrap; }
      .timeline__line { right: 11px; }
      .timeline__event { padding-left: var(--space-6); }
      .timeline__event-dot { right: calc(-1 * var(--space-6) + 2px); width: 16px; height: 16px; border-width: 2px; }
      .timeline__event-card { padding: var(--space-3); }
      .timeline__event-title { font-size: var(--text-base); }
      .timeline__event-desc { font-size: var(--text-sm); }
      .timeline__empty { padding: var(--space-12) var(--space-4); }
      .timeline__empty svg { width: 40px; height: 40px; }
      .timeline__empty p { font-size: var(--text-base); }
    }
  `],
})
export class TimelineViewComponent {
  events = input.required<CaseTimelineEvent[]>();

  searchQuery = signal('');
  activeFilter = signal<TimelineFilter>('all');

  filters: { id: TimelineFilter; label: string; icon: string }[] = [
    { id: 'all', label: 'الكل', icon: '📋' },
    { id: 'case', label: 'ملف', icon: '📁' },
    { id: 'task', label: 'مهمة', icon: '✅' },
    { id: 'document', label: 'وثيقة', icon: '📄' },
    { id: 'note', label: 'ملاحظة', icon: '📝' },
    { id: 'hearing', label: 'جلسة', icon: '⚖️' },
    { id: 'payment', label: 'دفع', icon: '💰' },
  ];

  filteredEvents = computed(() => {
    let result = this.events();
    const filter = this.activeFilter();
    const query = this.searchQuery().toLowerCase().trim();

    if (filter !== 'all') {
      result = result.filter(e => e.type === filter);
    }

    if (query) {
      result = result.filter(e =>
        e.title.toLowerCase().includes(query) ||
        (e.description?.toLowerCase().includes(query)) ||
        (e.location?.toLowerCase().includes(query))
      );
    }

    return result.sort((a, b) => b.date.localeCompare(a.date) || (b.time || '').localeCompare(a.time || ''));
  });

  groupedEvents = computed(() => {
    const groups: { date: string; events: CaseTimelineEvent[] }[] = [];
    const filtered = this.filteredEvents();

    for (const event of filtered) {
      let group = groups.find(g => g.date === event.date);
      if (!group) {
        group = { date: this.formatDate(event.date), events: [] };
        groups.push(group);
      }
      group.events.push(event);
    }

    return groups;
  });

  clearFilters() {
    this.searchQuery.set('');
    this.activeFilter.set('all');
  }

  getEventTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      case: 'ملف',
      task: 'مهمة',
      document: 'وثيقة',
      note: 'ملاحظة',
      hearing: 'جلسة',
      payment: 'دفع',
    };
    return labels[type] || type;
  }

  getEventIcon(type: string): string {
    const icons: Record<string, string> = {
      case: '📁',
      task: '✅',
      document: '📄',
      note: '📝',
      hearing: '⚖️',
      payment: '💰',
    };
    return icons[type] || '📋';
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'اليوم';
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'أمس';
    }

    return date.toLocaleDateString('ar-TN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
