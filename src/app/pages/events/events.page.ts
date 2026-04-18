import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../core/services/data.service';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="events-page">

      <!-- ════════════════════════════════════════════ -->
      <!-- PAGE HEADER                                    -->
      <!-- ════════════════════════════════════════════ -->
      <section class="page-header">
        <div class="page-header__pattern"></div>
        <div class="page-header__content">
          <h1>الفعاليات القادمة</h1>
          <p>مؤتمرات وتكوينات ولقاءات مهنية</p>
        </div>
      </section>

      <!-- ════════════════════════════════════════════ -->
      <!-- TIMELINE                                       -->
      <!-- ════════════════════════════════════════════ -->
      <section class="timeline-section">
        <div class="timeline">
          @for (event of eventItems; track event.id) {
            <div class="timeline-item" [style.animation-delay]="event.id * 0.1 + 's'">
              <div class="timeline-item__line"></div>
              <div class="timeline-item__dot">
                <span class="timeline-item__dot-pulse"></span>
              </div>
              <div class="timeline-item__card">
                <div class="timeline-item__date">
                  <span class="timeline-item__day">{{ getDay(event.date) }}</span>
                  <span class="timeline-item__month">{{ getMonth(event.date) }}</span>
                </div>
                <div class="timeline-item__content">
                  <h3>{{ event.title }}</h3>
                  <p>{{ event.description }}</p>
                  <div class="timeline-item__meta">
                    <span class="timeline-item__location">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      {{ event.location }}
                    </span>
                    <span class="timeline-item__date-label">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      {{ event.date }}
                    </span>
                  </div>
                  <a href="#" class="timeline-item__btn">
                    تسجيل
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                  </a>
                </div>
              </div>
            </div>
          }
        </div>
      </section>

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
      --clr-indigo: #6366f1;
      --clr-amber: #f59e0b;
      --radius-sm: 8px;
      --radius-md: 12px;
      --radius-lg: 16px;
      --shadow-card: 0 1px 3px rgba(0,0,0,.04), 0 1px 2px rgba(0,0,0,.06);
      --shadow-card-hover: 0 8px 24px rgba(0,0,0,.08), 0 4px 8px rgba(0,0,0,.04);
      --transition: .25s cubic-bezier(.4,0,.2,1);
    }

    .events-page {
      font-family: 'Cairo', system-ui, -apple-system, sans-serif;
      color: var(--clr-text);
      background: var(--clr-bg);
      direction: rtl;
    }

    /* ═══════════════════════════════════════════════
       PAGE HEADER
       ═══════════════════════════════════════════════ */
    .page-header {
      position: relative;
      background: linear-gradient(135deg, #0f2d5e 0%, #1a3a6e 50%, #ea3f48 100%);
      padding: 3rem 1.5rem;
      text-align: center;
      color: white;
      overflow: hidden;
    }
    .page-header__pattern {
      position: absolute;
      inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
      pointer-events: none;
    }
    .page-header__content { position: relative; z-index: 1; }
    .page-header h1 { font-size: 2rem; font-weight: 800; margin: 0 0 .5rem; }
    .page-header p { font-size: 1rem; opacity: .8; margin: 0; }

    /* ═══════════════════════════════════════════════
       TIMELINE
       ═══════════════════════════════════════════════ */
    .timeline-section {
      max-width: 800px;
      margin: 2rem auto;
      padding: 0 1.5rem 3rem;
    }
    .timeline {
      position: relative;
      padding-right: 2rem;
    }
    .timeline::before {
      content: '';
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: 2px;
      background: var(--clr-border);
    }
    .timeline-item {
      position: relative;
      margin-bottom: 1.5rem;
      animation: fadeUp .5s ease-out both;
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .timeline-item__line {
      position: absolute;
      right: -2rem;
      top: 0;
      bottom: -1.5rem;
      width: 2px;
      background: var(--clr-border);
    }
    .timeline-item:last-child .timeline-item__line { display: none; }
    .timeline-item__dot {
      position: absolute;
      right: -2.55rem;
      top: 1.5rem;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--clr-surface);
      border: 2px solid var(--clr-brand);
      z-index: 1;
    }
    .timeline-item__dot-pulse {
      display: block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--clr-brand);
      margin: 2px auto;
    }
    .timeline-item__card {
      display: flex;
      gap: 1.25rem;
      background: var(--clr-surface);
      border: 1px solid var(--clr-border);
      border-radius: var(--radius-lg);
      padding: 1.25rem;
      box-shadow: var(--shadow-card);
      transition: all var(--transition);
    }
    .timeline-item__card:hover {
      box-shadow: var(--shadow-card-hover);
      transform: translateX(-4px);
    }
    .timeline-item__date {
      flex-shrink: 0;
      width: 60px;
      text-align: center;
      background: linear-gradient(135deg, var(--clr-brand), var(--clr-brand-dark));
      border-radius: var(--radius-md);
      padding: .65rem .5rem;
      color: white;
    }
    .timeline-item__day {
      display: block;
      font-size: 1.5rem;
      font-weight: 800;
      line-height: 1;
    }
    .timeline-item__month {
      display: block;
      font-size: .65rem;
      font-weight: 600;
      text-transform: uppercase;
      opacity: .8;
      margin-top: .15rem;
    }
    .timeline-item__content { flex: 1; min-width: 0; }
    .timeline-item__content h3 {
      font-size: .95rem;
      font-weight: 700;
      margin: 0 0 .35rem;
      color: var(--clr-text);
    }
    .timeline-item__content p {
      font-size: .82rem;
      color: var(--clr-text-secondary);
      margin: 0 0 .65rem;
      line-height: 1.5;
    }
    .timeline-item__meta {
      display: flex;
      gap: 1rem;
      margin-bottom: .75rem;
      flex-wrap: wrap;
    }
    .timeline-item__location,
    .timeline-item__date-label {
      display: inline-flex;
      align-items: center;
      gap: .3rem;
      font-size: .75rem;
      color: var(--clr-text-muted);
    }
    .timeline-item__location svg,
    .timeline-item__date-label svg {
      width: 13px;
      height: 13px;
    }
    .timeline-item__btn {
      display: inline-flex;
      align-items: center;
      gap: .35rem;
      font-size: .78rem;
      font-weight: 700;
      color: var(--clr-brand);
      text-decoration: none;
      transition: gap var(--transition);
    }
    .timeline-item__btn svg {
      width: 14px;
      height: 14px;
    }
    .timeline-item__btn:hover { gap: .6rem; }

    /* Responsive */
    @media (max-width: 640px) {
      .timeline-item__card { flex-direction: column; }
      .timeline-item__date { width: auto; text-align: right; padding: .5rem .75rem; display: flex; align-items: baseline; gap: .5rem; }
      .timeline-item__month { margin-top: 0; }
    }
  `],
})
export class EventsPage {
  private data = inject(DataService);
  eventItems = this.data.getEventItems();

  getMonth(dateStr: string): string {
    const months = ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    return months[new Date(dateStr).getMonth()];
  }

  getDay(dateStr: string): string {
    return new Date(dateStr).getDate().toString();
  }
}
