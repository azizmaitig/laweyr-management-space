import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../core/services/data.service';

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="news-page">

      <!-- ════════════════════════════════════════════ -->
      <!-- PAGE HEADER                                    -->
      <!-- ════════════════════════════════════════════ -->
      <section class="page-header">
        <div class="page-header__pattern"></div>
        <div class="page-header__content">
          <h1>الأخبار القانونية</h1>
          <p>ابقوا على اطلاع بآخر الأخبار والمستجدات القانونية</p>
        </div>
      </section>

      <!-- ════════════════════════════════════════════ -->
      <!-- NEWS GRID                                      -->
      <!-- ════════════════════════════════════════════ -->
      <section class="news-section">
        <div class="news-grid">
          @for (item of newsItems; track item.id) {
            <article class="news-card" [style.animation-delay]="item.id * 0.08 + 's'">
              <div class="news-card__image" [class]="'news-card__image--' + (item.id % 4)">
                <div class="news-card__image-overlay">
                  <span class="news-card__category" [class]="'news-card__category--' + getCategoryClass(item.category)">
                    {{ item.category }}
                  </span>
                </div>
              </div>
              <div class="news-card__body">
                <div class="news-card__meta">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <span>{{ item.date }}</span>
                </div>
                <h3 class="news-card__title">{{ item.title }}</h3>
                <p class="news-card__excerpt">{{ item.excerpt }}</p>
                <a href="#" class="news-card__link">
                  اقرأ المزيد
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </a>
              </div>
            </article>
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
      --radius-xl: 20px;
      --shadow-card: 0 1px 3px rgba(0,0,0,.04), 0 1px 2px rgba(0,0,0,.06);
      --shadow-card-hover: 0 8px 24px rgba(0,0,0,.08), 0 4px 8px rgba(0,0,0,.04);
      --transition: .25s cubic-bezier(.4,0,.2,1);
    }

    .news-page {
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
    .page-header__content {
      position: relative;
      z-index: 1;
    }
    .page-header h1 {
      font-size: 2rem;
      font-weight: 800;
      margin: 0 0 .5rem;
    }
    .page-header p {
      font-size: 1rem;
      opacity: .8;
      margin: 0;
    }

    /* ═══════════════════════════════════════════════
       NEWS GRID
       ═══════════════════════════════════════════════ */
    .news-section {
      max-width: 1100px;
      margin: 2rem auto;
      padding: 0 1.5rem 3rem;
    }
    .news-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.25rem;
    }
    .news-card {
      background: var(--clr-surface);
      border: 1px solid var(--clr-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-card);
      transition: all var(--transition);
      animation: fadeUp .5s ease-out both;
    }
    .news-card:hover {
      box-shadow: var(--shadow-card-hover);
      transform: translateY(-4px);
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .news-card__image {
      height: 160px;
      position: relative;
      overflow: hidden;
    }
    .news-card__image::before {
      content: '';
      position: absolute;
      inset: 0;
    }
    .news-card__image--0::before { background: linear-gradient(135deg, #ea3f48, #c8333d); }
    .news-card__image--1::before { background: linear-gradient(135deg, #0f2d5e, #1a3a6e); }
    .news-card__image--2::before { background: linear-gradient(135deg, #0d9488, #0f766e); }
    .news-card__image--3::before { background: linear-gradient(135deg, #6366f1, #4f46e5); }
    .news-card__image-overlay {
      position: relative;
      z-index: 1;
      height: 100%;
      display: flex;
      align-items: flex-start;
      justify-content: flex-end;
      padding: .75rem;
    }
    .news-card__category {
      font-size: .65rem;
      font-weight: 700;
      padding: .2rem .55rem;
      border-radius: 6px;
      background: rgba(255,255,255,.2);
      backdrop-filter: blur(6px);
      color: white;
      border: 1px solid rgba(255,255,255,.25);
    }
    .news-card__body {
      padding: 1.25rem;
    }
    .news-card__meta {
      display: flex;
      align-items: center;
      gap: .35rem;
      font-size: .72rem;
      color: var(--clr-text-muted);
      margin-bottom: .5rem;
    }
    .news-card__meta svg {
      width: 13px;
      height: 13px;
    }
    .news-card__title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--clr-text);
      margin: 0 0 .5rem;
      line-height: 1.5;
    }
    .news-card__excerpt {
      font-size: .82rem;
      color: var(--clr-text-secondary);
      line-height: 1.6;
      margin: 0 0 .75rem;
    }
    .news-card__link {
      display: inline-flex;
      align-items: center;
      gap: .35rem;
      font-size: .82rem;
      font-weight: 700;
      color: var(--clr-brand);
      text-decoration: none;
      transition: gap var(--transition);
    }
    .news-card__link svg {
      width: 15px;
      height: 15px;
      transition: transform var(--transition);
    }
    .news-card__link:hover {
      gap: .6rem;
    }
    .news-card__link:hover svg {
      transform: translateX(-3px);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .news-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class NewsPage {
  private data = inject(DataService);
  newsItems = this.data.getNewsItems();

  getCategoryClass(category: string): string {
    const map: Record<string, string> = {
      'Réforme': 'reform',
      'Profession': 'profession',
      'Formation': 'formation',
      'Événement': 'event',
    };
    return map[category] || 'default';
  }
}
