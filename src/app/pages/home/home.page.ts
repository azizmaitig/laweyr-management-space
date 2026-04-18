import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="home-page">

      <!-- ════════════════════════════════════════════ -->
      <!-- HERO SECTION                                   -->
      <!-- ════════════════════════════════════════════ -->
      <section class="hero">
        <div class="hero__pattern"></div>
        <div class="hero__glow hero__glow--red"></div>
        <div class="hero__glow hero__glow--blue"></div>
        <div class="hero__content">
          <div class="hero__badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Ordre Régional des Avocats de Nabeul
          </div>
          <h1 class="hero__title">الفرع الجهوي للمحامين بنابل</h1>
          <p class="hero__subtitle">في خدمة العدالة والقانون والمواطنين منذ تأسيس الفرع</p>
          <div class="hero__actions">
            <a routerLink="/annuaire-avocats" class="btn btn--primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              استشارة الدليل
            </a>
            <a routerLink="/actualites" class="btn btn--outline">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              عرض الأخبار
            </a>
          </div>
        </div>
      </section>

      <!-- ════════════════════════════════════════════ -->
      <!-- STATS                                          -->
      <!-- ════════════════════════════════════════════ -->
      <section class="stats">
        <div class="stats__inner">
          <div class="stat-card stat-card--lawyers">
            <div class="stat-card__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            </div>
            <div class="stat-card__value">150+</div>
            <div class="stat-card__label">محامٍ مسجل</div>
          </div>
          <div class="stat-card stat-card--cases">
            <div class="stat-card__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </div>
            <div class="stat-card__value">2,500+</div>
            <div class="stat-card__label">قضية معالجة</div>
          </div>
          <div class="stat-card stat-card--cities">
            <div class="stat-card__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <div class="stat-card__value">8</div>
            <div class="stat-card__label">مدينة مغطاة</div>
          </div>
        </div>
      </section>

      <!-- ════════════════════════════════════════════ -->
      <!-- WELCOME                                      -->
      <!-- ════════════════════════════════════════════ -->
      <section class="welcome">
        <div class="welcome__inner">
          <div class="welcome__accent"></div>
          <h2 class="welcome__title">مرحباً بكم</h2>
          <p class="welcome__text">
            الفرع الجهوي للمحامين بنابل في خدمة العدالة والقانون والمواطنين.
            اكتشفوا خدماتنا واستشيروا دليل المحامين المسجلين.
            نعمل من أجل تعزيز مهنة المحاماة وخدمة العدالة في الجهة.
          </p>
          <div class="welcome__divider"></div>
          <a routerLink="/contact" class="btn btn--sm btn--brand">
            تواصلوا معنا
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </a>
        </div>
      </section>

      <!-- ════════════════════════════════════════════ -->
      <!-- FEATURES / QUICK LINKS                         -->
      <!-- ════════════════════════════════════════════ -->
      <section class="features">
        <h2 class="features__title">روابط سريعة</h2>
        <div class="features__grid">
          <a routerLink="/annuaire-avocats" class="feature-card feature-card--directory">
            <div class="feature-card__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <h3>دليل المحامين</h3>
            <p>ابحثوا عن محامٍ بالاسم أو التخصص أو الولاية</p>
            <span class="feature-card__arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </span>
          </a>
          <a routerLink="/textes-juridiques" class="feature-card feature-card--legal">
            <div class="feature-card__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            </div>
            <h3>النصوص القانونية</h3>
            <p>استشيروا نصوص القانون والمراجع القانونية</p>
            <span class="feature-card__arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </span>
          </a>
          <a routerLink="/evenements" class="feature-card feature-card--events">
            <div class="feature-card__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <h3>الفعاليات</h3>
            <p>اكتشفوا المؤتمرات والتكوينات القادمة</p>
            <span class="feature-card__arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </span>
          </a>
          <a routerLink="/contact" class="feature-card feature-card--contact">
            <div class="feature-card__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </div>
            <h3>اتصل بنا</h3>
            <p>نحن في خدمتكم لأي استفسار أو طلب</p>
            <span class="feature-card__arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </span>
          </a>
        </div>
      </section>

    </div>
  `,
  styles: [`
    /* ═══════════════════════════════════════════════
       TOKENS
       ═══════════════════════════════════════════════ */
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
      --clr-amber: #f59e0b;
      --clr-indigo: #6366f1;
      --radius-sm: 8px;
      --radius-md: 12px;
      --radius-lg: 16px;
      --radius-xl: 20px;
      --shadow-card: 0 1px 3px rgba(0,0,0,.04), 0 1px 2px rgba(0,0,0,.06);
      --shadow-card-hover: 0 8px 24px rgba(0,0,0,.08), 0 4px 8px rgba(0,0,0,.04);
      --transition: .25s cubic-bezier(.4,0,.2,1);
    }

    .home-page {
      font-family: 'Cairo', system-ui, -apple-system, sans-serif;
      color: var(--clr-text);
      background: var(--clr-bg);
    }

    /* ═══════════════════════════════════════════════
       HERO
       ═══════════════════════════════════════════════ */
    .hero {
      position: relative;
      min-height: 520px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0f2d5e 0%, #1a3a6e 45%, #ea3f48 100%);
      overflow: hidden;
    }
    .hero__pattern {
      position: absolute;
      inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
      pointer-events: none;
    }
    .hero__glow {
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
    }
    .hero__glow--red {
      width: 400px;
      height: 400px;
      top: -10%;
      right: -5%;
      background: radial-gradient(circle, rgba(234,63,72,.18) 0%, transparent 70%);
    }
    .hero__glow--blue {
      width: 350px;
      height: 350px;
      bottom: -15%;
      left: -5%;
      background: radial-gradient(circle, rgba(15,45,94,.25) 0%, transparent 70%);
    }
    .hero__content {
      position: relative;
      z-index: 1;
      text-align: center;
      color: white;
      padding: 3rem 1.5rem;
      max-width: 700px;
    }
    .hero__badge {
      display: inline-flex;
      align-items: center;
      gap: .5rem;
      background: rgba(255,255,255,.1);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,.15);
      padding: .4rem 1rem;
      border-radius: 30px;
      font-size: .78rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
    }
    .hero__badge svg {
      width: 16px;
      height: 16px;
      opacity: .8;
    }
    .hero__title {
      font-size: 2.25rem;
      font-weight: 800;
      margin: 0 0 .75rem;
      line-height: 1.25;
      text-shadow: 0 2px 12px rgba(0,0,0,.15);
    }
    .hero__subtitle {
      font-size: 1.1rem;
      opacity: .8;
      margin: 0 0 2rem;
      line-height: 1.6;
    }
    .hero__actions {
      display: flex;
      gap: .75rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: .5rem;
      padding: .7rem 1.5rem;
      border-radius: var(--radius-md);
      font-family: inherit;
      font-size: .9rem;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
      transition: all var(--transition);
      border: none;
    }
    .btn svg {
      width: 18px;
      height: 18px;
    }
    .btn--primary {
      background: white;
      color: var(--clr-brand-dark);
      box-shadow: 0 4px 16px rgba(0,0,0,.15);
    }
    .btn--primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0,0,0,.2);
    }
    .btn--outline {
      background: transparent;
      color: white;
      border: 1.5px solid rgba(255,255,255,.35);
    }
    .btn--outline:hover {
      background: rgba(255,255,255,.1);
      border-color: rgba(255,255,255,.6);
    }
    .btn--sm {
      padding: .45rem 1rem;
      font-size: .82rem;
    }
    .btn--brand {
      background: var(--clr-brand);
      color: white;
    }
    .btn--brand:hover {
      background: #c8333d;
      transform: translateY(-1px);
    }

    /* ═══════════════════════════════════════════════
       STATS
       ═══════════════════════════════════════════════ */
    .stats {
      margin-top: -2.5rem;
      position: relative;
      z-index: 2;
      padding: 0 1.5rem;
    }
    .stats__inner {
      max-width: 960px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }
    .stat-card {
      background: var(--clr-surface);
      border: 1px solid var(--clr-border);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      text-align: center;
      box-shadow: var(--shadow-card);
      transition: all var(--transition);
    }
    .stat-card:hover {
      box-shadow: var(--shadow-card-hover);
      transform: translateY(-4px);
    }
    .stat-card__icon {
      width: 52px;
      height: 52px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto .75rem;
    }
    .stat-card__icon svg {
      width: 24px;
      height: 24px;
    }
    .stat-card--lawyers .stat-card__icon { background: #fef2f2; color: var(--clr-brand); }
    .stat-card--cases .stat-card__icon { background: #eff6ff; color: #3b82f6; }
    .stat-card--cities .stat-card__icon { background: #f0fdfa; color: var(--clr-teal); }
    .stat-card__value {
      font-size: 2rem;
      font-weight: 800;
      color: var(--clr-text);
      line-height: 1;
      margin-bottom: .25rem;
    }
    .stat-card__label {
      font-size: .8rem;
      color: var(--clr-text-muted);
    }

    /* ═══════════════════════════════════════════════
       WELCOME
       ═══════════════════════════════════════════════ */
    .welcome {
      max-width: 800px;
      margin: 3rem auto 0;
      padding: 0 1.5rem;
    }
    .welcome__inner {
      position: relative;
      text-align: center;
      padding: 2rem;
    }
    .welcome__accent {
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 60px;
      height: 3px;
      background: linear-gradient(90deg, var(--clr-brand), var(--clr-brand-dark));
      border-radius: 2px;
    }
    .welcome__title {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--clr-brand-dark);
      margin: 0 0 .75rem;
    }
    .welcome__text {
      font-size: .95rem;
      color: var(--clr-text-secondary);
      line-height: 1.8;
      margin: 0;
    }
    .welcome__divider {
      width: 40px;
      height: 2px;
      background: var(--clr-border);
      margin: 1.25rem auto;
      border-radius: 1px;
    }

    /* ═══════════════════════════════════════════════
       FEATURES
       ═══════════════════════════════════════════════ */
    .features {
      max-width: 1100px;
      margin: 2.5rem auto 0;
      padding: 0 1.5rem 3rem;
    }
    .features__title {
      text-align: center;
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--clr-brand-dark);
      margin: 0 0 1.5rem;
    }
    .features__grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1rem;
    }
    .feature-card {
      position: relative;
      background: var(--clr-surface);
      border: 1px solid var(--clr-border);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      text-decoration: none;
      color: inherit;
      box-shadow: var(--shadow-card);
      transition: all var(--transition);
      display: flex;
      flex-direction: column;
      gap: .5rem;
      overflow: hidden;
    }
    .feature-card::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 3px;
      border-radius: 0 0 var(--radius-lg) var(--radius-lg);
      transition: opacity var(--transition);
      opacity: 0;
    }
    .feature-card:hover {
      box-shadow: var(--shadow-card-hover);
      transform: translateY(-4px);
    }
    .feature-card:hover::after { opacity: 1; }
    .feature-card--directory::after { background: var(--clr-brand); }
    .feature-card--legal::after { background: var(--clr-indigo); }
    .feature-card--events::after { background: var(--clr-teal); }
    .feature-card--contact::after { background: var(--clr-amber); }
    .feature-card__icon {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: .25rem;
    }
    .feature-card__icon svg {
      width: 22px;
      height: 22px;
    }
    .feature-card--directory .feature-card__icon { background: #fef2f2; color: var(--clr-brand); }
    .feature-card--legal .feature-card__icon { background: #e0e7ff; color: var(--clr-indigo); }
    .feature-card--events .feature-card__icon { background: #f0fdfa; color: var(--clr-teal); }
    .feature-card--contact .feature-card__icon { background: #fffbeb; color: var(--clr-amber); }
    .feature-card h3 {
      font-size: .95rem;
      font-weight: 700;
      margin: 0;
      color: var(--clr-text);
    }
    .feature-card p {
      font-size: .8rem;
      color: var(--clr-text-secondary);
      margin: 0;
      line-height: 1.5;
      flex: 1;
    }
    .feature-card__arrow {
      display: inline-flex;
      align-items: center;
      justify-content: flex-end;
      color: var(--clr-text-muted);
      transition: all var(--transition);
    }
    .feature-card__arrow svg {
      width: 18px;
      height: 18px;
    }
    .feature-card:hover .feature-card__arrow {
      color: var(--clr-brand);
      transform: translateX(-4px);
    }

    /* ═══════════════════════════════════════════════
       RESPONSIVE
       ═══════════════════════════════════════════════ */
    @media (max-width: 768px) {
      .hero { min-height: 420px; }
      .hero__title { font-size: 1.6rem; }
      .hero__subtitle { font-size: .95rem; }
      .stats__inner { grid-template-columns: 1fr; }
      .hero__actions { flex-direction: column; align-items: center; }
      .btn { width: 100%; justify-content: center; max-width: 280px; }
    }
  `],
})
export class HomePage {
  private translation = inject(TranslationService);
}
