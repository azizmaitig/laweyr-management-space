import { afterNextRender, Component, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { FilesPage } from '../../features/files/files.page';
import { SubAccountsSettingsComponent } from './sub-accounts-settings.component';
import { SettingsStateService } from '../../features/platform/services/settings-state.service';

@Component({
  selector: 'app-ea-settings',
  standalone: true,
  imports: [CommonModule, FilesPage, SubAccountsSettingsComponent],
  template: `
    <div class="ea-settings">
      <header class="ea-settings__hero">
        <div class="ea-settings__hero-text">
          <h1 class="ea-settings__title">الإعدادات</h1>
          <p class="ea-settings__subtitle">إدارة حسابك، أمان الوصول، ملفاتك، وجلسة العمل.</p>
        </div>
      </header>

      <nav class="settings-nav" aria-label="تنقّل أقسام الإعدادات">
        <button type="button" class="settings-nav__link" (click)="scrollToSection('section-account')">
          👤 الحساب والأمان
        </button>
        <button type="button" class="settings-nav__link" (click)="scrollToSection('section-appearance')">
          🖥️ Display
        </button>
        <button type="button" class="settings-nav__link" (click)="scrollToSection('section-team')">
          👥 الفريق والوصول
        </button>
        <button type="button" class="settings-nav__link" (click)="scrollToSection('section-files')">
          📁 Mes dossiers
        </button>
        <button
          type="button"
          class="settings-nav__link settings-nav__link--danger"
          (click)="scrollToSection('section-danger')"
        >
          ⚠️ منطقة الخطر
        </button>
      </nav>

      <div class="ea-settings__body">
        <section id="section-account" class="settings-section" tabindex="-1">
          <div class="settings-section__intro">
            <h2 class="settings-section__title">الحساب والأمان</h2>
            <p class="settings-section__lead">الملف الشخصي، كلمة المرور، وتفضيلات الإشعارات.</p>
          </div>

          <div class="settings-section__grid settings-section__grid--pair">
            <article class="settings-card" aria-labelledby="settings-profile-heading">
              <h3 id="settings-profile-heading" class="settings-card__h">👤 معلومات الملف الشخصي</h3>
              <div class="profile-header">
                <div class="profile-avatar">{{ getInitials() }}</div>
                <div class="profile-info">
                  <h4>{{ auth.user()?.name }}</h4>
                  <p>{{ auth.user()?.title }} · {{ auth.user()?.barNumber }}</p>
                </div>
              </div>
              <div class="profile-details">
                <div class="profile-row">
                  <span>التخصص</span><strong>{{ auth.user()?.specialization }}</strong>
                </div>
                <div class="profile-row">
                  <span>البريد الإلكتروني</span><strong>{{ auth.user()?.email }}</strong>
                </div>
              </div>
            </article>

            <article class="settings-card" aria-labelledby="settings-password-heading">
              <h3 id="settings-password-heading" class="settings-card__h">🔑 تغيير كلمة المرور</h3>
              <div class="form-grid">
                <div class="form-field">
                  <label>كلمة المرور الحالية</label>
                  <input type="password" class="form-input" placeholder="••••••••" autocomplete="current-password" />
                </div>
                <div class="form-field">
                  <label>كلمة المرور الجديدة</label>
                  <input type="password" class="form-input" placeholder="••••••••" autocomplete="new-password" />
                </div>
                <div class="form-field">
                  <label>تأكيد كلمة المرور</label>
                  <input type="password" class="form-input" placeholder="••••••••" autocomplete="new-password" />
                </div>
              </div>
              <button type="button" class="btn btn--primary" (click)="changePassword()">حفظ كلمة المرور</button>
            </article>
          </div>

          <article class="settings-card settings-card--notif" aria-labelledby="settings-notif-heading">
            <h3 id="settings-notif-heading" class="settings-card__h">🔔 إعدادات الإشعارات</h3>
            <p class="settings-card__micro">اختر ما تريد استقباله دون التأثير على تنبيهات النظام الإلزامية.</p>
            @for (pref of notifPrefs(); track pref.key) {
              <div class="notif-pref">
                <div class="notif-pref__info">
                  <span class="notif-pref__label">{{ pref.label }}</span>
                  <span class="notif-pref__desc">{{ pref.desc }}</span>
                </div>
                <button
                  type="button"
                  class="toggle"
                  [class.toggle--on]="pref.enabled"
                  [attr.aria-pressed]="pref.enabled"
                  (click)="pref.enabled = !pref.enabled"
                >
                  <span class="toggle__knob"></span>
                </button>
              </div>
            }
          </article>
        </section>

        <section id="section-appearance" class="settings-section" tabindex="-1">
          <div class="settings-section__intro">
            <h2 class="settings-section__title">Display</h2>
            <p class="settings-section__lead">Switch between dark and light mode.</p>
          </div>

          <article class="settings-card" aria-labelledby="settings-theme-heading">
            <h3 id="settings-theme-heading" class="settings-card__h">🌙 Dark mode</h3>
            <div class="pref-row">
              <div class="pref-row__info">
                <span class="pref-row__label">Dark mode</span>
                <span class="pref-row__desc">Better for working at night and reduces eye strain.</span>
              </div>
              <button
                type="button"
                class="toggle"
                [class.toggle--on]="settingsTheme() === 'DARK'"
                [attr.aria-pressed]="settingsTheme() === 'DARK'"
                (click)="settings.toggleTheme()"
              >
                <span class="toggle__knob"></span>
              </button>
            </div>
          </article>
        </section>

        <section id="section-team" class="settings-section" tabindex="-1">
          <div class="settings-section__intro">
            <h2 class="settings-section__title">الفريق والوصول</h2>
            <p class="settings-section__lead">الحسابات الفرعية، الدعوات، وصلاحيات كل مستخدم على بيانات المكتب.</p>
          </div>
          <div class="settings-card settings-card--wide settings-card--subaccounts">
            <h3 class="settings-card__h">👥 الحسابات الفرعية والوصول</h3>
            <p class="settings-card__lead">
              دعوة الفريق، تفعيل الحسابات، وضبط صلاحيات العرض والتعديل لكل مستخدم.
            </p>
            <app-sub-accounts-settings />
          </div>
        </section>

        <section id="section-files" class="settings-section" tabindex="-1">
          <div class="settings-section__intro">
            <h2 class="settings-section__title">Mes dossiers</h2>
            <p class="settings-section__lead">الملفات المحلية وربط Google Drive و Dropbox.</p>
          </div>
          <div class="settings-card settings-card--wide settings-card--files">
            <app-files [embedded]="true" [hideEmbeddedTitle]="true" />
          </div>
        </section>

        <section id="section-danger" class="settings-section settings-section--last" tabindex="-1">
          <div class="settings-section__intro">
            <h2 class="settings-section__title">منطقة الخطر</h2>
            <p class="settings-section__lead">إجراءات لا رجعة فيها تخص جلستك الحالية.</p>
          </div>
          <div class="settings-card settings-card--danger">
            <h3 class="settings-card__h">⚠️ تسجيل الخروج</h3>
            <p class="danger-text">سيتم تسجيل خروجك من هذا الجهاز وإنهاء الجلسة الحالية.</p>
            <button type="button" class="btn btn--danger" (click)="logout()">تسجيل الخروج</button>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --clr-brand: #ea3f48;
      --clr-teal: #0d9488;
      --radius-sm: 8px;
      --radius-md: 12px;
      --radius-lg: 16px;
      --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06);
      --transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .ea-settings {
      font-family: 'Cairo', system-ui, sans-serif;
      color: var(--clr-text);
      max-width: 920px;
      margin: 0 auto;
      padding: 0 0 2.5rem;
    }
    .ea-settings__hero {
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--clr-border);
    }
    .ea-settings__title {
      font-size: 1.35rem;
      font-weight: 800;
      margin: 0;
      letter-spacing: -0.02em;
    }
    .ea-settings__subtitle {
      font-size: 0.8rem;
      color: var(--clr-text-secondary);
      margin: 0.35rem 0 0;
      line-height: 1.55;
      max-width: 36rem;
    }

    .settings-nav {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-bottom: 1.5rem;
      padding: 0.35rem;
      background: var(--clr-bg);
      border: 1px solid var(--clr-border);
      border-radius: var(--radius-lg);
    }
    .settings-nav__link {
      display: inline-flex;
      align-items: center;
      padding: 0.45rem 0.85rem;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 700;
      font-family: inherit;
      color: var(--clr-text-secondary);
      text-decoration: none;
      border: 1px solid transparent;
      background: transparent;
      cursor: pointer;
      transition: background var(--transition), color var(--transition), border-color var(--transition);
    }
    .settings-nav__link:hover {
      background: var(--clr-surface);
      color: var(--clr-text);
      border-color: var(--clr-border);
    }
    .settings-nav__link--danger:hover {
      color: var(--clr-brand);
      border-color: #fecaca;
      background: #fff5f5;
    }

    .ea-settings__body {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    /* Leave room for sticky .ea-tabs in espace-avocat shell (~52px) + padding */
    .settings-section {
      scroll-margin-top: 4.75rem;
    }
    .settings-section__intro {
      margin-bottom: 0.85rem;
    }
    .settings-section__title {
      font-size: 0.72rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--clr-teal);
      margin: 0 0 0.25rem;
    }
    .settings-section__lead {
      font-size: 0.82rem;
      color: var(--clr-text-secondary);
      margin: 0;
      line-height: 1.5;
    }
    .settings-section__grid {
      display: grid;
      gap: 1rem;
    }
    .settings-section__grid--pair {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    @media (max-width: 720px) {
      .settings-section__grid--pair {
        grid-template-columns: 1fr;
      }
    }

    .settings-card {
      background: var(--clr-surface);
      border: 1px solid var(--clr-border);
      border-radius: var(--radius-lg);
      padding: 1.25rem;
      box-shadow: var(--shadow-card);
    }
    .settings-card__h {
      font-size: 0.9rem;
      font-weight: 700;
      margin: 0 0 1rem;
    }
    .settings-card__micro {
      font-size: 0.72rem;
      color: var(--clr-text-muted);
      margin: -0.5rem 0 0.85rem;
      line-height: 1.45;
    }
    .settings-card--subaccounts .settings-card__h {
      margin-bottom: 0.35rem;
    }
    .settings-card__lead {
      font-size: 0.76rem;
      color: var(--clr-text-secondary);
      line-height: 1.55;
      margin: 0 0 1rem;
    }
    .settings-card--wide {
      width: 100%;
    }
    .settings-card--notif {
      margin-top: 1rem;
    }
    .settings-card--files {
      padding: 1.25rem 1.25rem 1.5rem;
    }
    .settings-card--danger {
      border-color: #fecaca;
      max-width: 420px;
    }

    .profile-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    .profile-avatar {
      width: 56px;
      height: 56px;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, var(--clr-brand), #c8333d);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      font-weight: 800;
      flex-shrink: 0;
    }
    .profile-info h4 {
      font-size: 0.95rem;
      font-weight: 700;
      margin: 0;
    }
    .profile-info p {
      font-size: 0.75rem;
      color: var(--clr-text-muted);
      margin: 0.1rem 0 0;
    }
    .profile-details {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .profile-row {
      display: flex;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.4rem 0;
      border-bottom: 1px solid var(--clr-border);
      font-size: 0.82rem;
    }
    .profile-row span {
      color: var(--clr-text-secondary);
    }
    .profile-row strong {
      color: var(--clr-text);
      text-align: end;
      font-weight: 600;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.65rem;
      margin-bottom: 1rem;
    }
    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }
    .form-field label {
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--clr-text-secondary);
    }
    .form-input {
      padding: 0.5rem 0.65rem;
      border: 1.5px solid var(--clr-border);
      border-radius: var(--radius-sm);
      font-family: inherit;
      font-size: 0.82rem;
      background: var(--clr-bg);
      color: var(--clr-text);
      outline: none;
      transition: border-color var(--transition);
    }
    .form-input:focus {
      border-color: var(--clr-brand);
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      padding: 0.55rem 1.1rem;
      border-radius: var(--radius-sm);
      font-family: inherit;
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
      transition: all var(--transition);
      border: none;
    }
    .btn--primary {
      background: var(--clr-brand);
      color: white;
    }
    .btn--primary:hover {
      background: #c8333d;
    }
    .btn--danger {
      background: #fef2f2;
      color: var(--clr-brand);
      border: 1.5px solid #fecaca;
    }
    .btn--danger:hover {
      background: var(--clr-brand);
      color: white;
    }
    .danger-text {
      font-size: 0.8rem;
      color: var(--clr-brand);
      margin: 0 0 0.75rem;
      line-height: 1.5;
    }

    .notif-pref {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
      padding: 0.65rem 0;
      border-bottom: 1px solid var(--clr-border);
    }
    .notif-pref:last-child {
      border-bottom: none;
    }
    .notif-pref__label {
      display: block;
      font-size: 0.82rem;
      font-weight: 600;
    }
    .notif-pref__desc {
      display: block;
      font-size: 0.7rem;
      color: var(--clr-text-muted);
    }

    .pref-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
    }
    .pref-row__label {
      display: block;
      font-size: 0.82rem;
      font-weight: 700;
    }
    .pref-row__desc {
      display: block;
      font-size: 0.72rem;
      color: var(--clr-text-muted);
      margin-top: 0.15rem;
      line-height: 1.4;
    }
    .toggle {
      width: 44px;
      height: 24px;
      border-radius: 12px;
      border: 2px solid var(--clr-border);
      background: var(--clr-bg);
      cursor: pointer;
      position: relative;
      transition: all var(--transition);
      flex-shrink: 0;
    }
    .toggle--on {
      background: var(--clr-teal);
      border-color: var(--clr-teal);
    }
    .toggle__knob {
      position: absolute;
      top: 2px;
      right: 2px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: white;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
      transition: all var(--transition);
    }
    .toggle--on .toggle__knob {
      right: calc(100% - 18px);
    }
  `],
})
export class EASettingsPage {
  auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  readonly settings = inject(SettingsStateService);
  readonly settingsTheme = signal<'LIGHT' | 'DARK'>('LIGHT');

  constructor() {
    afterNextRender(() => {
      const fragment =
        this.route.snapshot.fragment ?? this.router.parseUrl(this.router.url).fragment ?? undefined;
      if (fragment) {
        setTimeout(() => this.scrollToSection(fragment), 0);
      }
    });

    this.settings.theme$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this.settingsTheme.set(v));
  }

  /** In-app jump links: native #hash breaks under sticky shell tabs; scroll the document explicitly. */
  scrollToSection(sectionId: string): void {
    const el = document.getElementById(sectionId);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    queueMicrotask(() => {
      try {
        el.focus({ preventScroll: true });
      } catch {
        /* focus not supported on all elements in some browsers */
      }
    });
  }

  notifPrefs = signal([
    { key: 'hearings', label: 'تنبيهات الجلسات', desc: 'إشعار قبل كل جلسة بـ 24 ساعة', enabled: true },
    { key: 'payments', label: 'تنبيهات المدفوعات', desc: 'إشعار عند تلقي دفعة جديدة', enabled: true },
    { key: 'deadlines', label: 'تنبيهات المواعيد النهائية', desc: 'إشعار قبل انتهاء الموعد بـ 48 ساعة', enabled: true },
    { key: 'marketing', label: 'الأخبار والتحديثات', desc: 'استقبال أخبار الفرع والتحديثات', enabled: false },
  ]);

  getInitials(): string {
    const name = this.auth.user()?.name || '';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2);
  }

  changePassword() {
    /* stub */
  }
  logout() {
    this.auth.logout();
  }
}
