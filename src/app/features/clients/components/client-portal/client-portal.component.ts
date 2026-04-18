import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventService } from '../../../../core/services/event.service';
import { AppEventType } from '../../../../core/models/events.model';
import { AuthService } from '../../../../core/services/auth.service';

interface PortalActivity {
  id: number;
  type: 'update' | 'document' | 'session';
  title: string;
  date: string;
  description?: string;
}

@Component({
  selector: 'app-client-portal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (!isLoggedIn()) {
      <!-- Login Form -->
      <div class="portal-login">
        <div class="portal-login__card">
          <h2>بوابة العميل</h2>
          <p>سجل الدخول للوصول إلى ملفاتك</p>
          <form (ngSubmit)="onLogin()" class="portal-login__form">
            <div class="portal-login__field">
              <label for="portal-email">البريد الإلكتروني</label>
              <input type="email" id="portal-email" [(ngModel)]="email" name="email" required class="portal-login__input" placeholder="example@email.com" dir="ltr">
            </div>
            <div class="portal-login__field">
              <label for="portal-password">كلمة المرور</label>
              <input type="password" id="portal-password" [(ngModel)]="password" name="password" required class="portal-login__input" placeholder="••••••••">
            </div>
            <button type="submit" class="portal-login__btn" [disabled]="!email || !password">تسجيل الدخول</button>
          </form>
        </div>
      </div>
    } @else {
      <!-- Portal Dashboard -->
      <div class="portal-dashboard">
        <header class="portal-dashboard__header">
          <div>
            <h2>مرحباً، {{ clientName() }}</h2>
            <p>آخر تسجيل دخول: {{ lastLogin() }}</p>
          </div>
          <button class="portal-dashboard__logout" (click)="onLogout()">تسجيل الخروج</button>
        </header>

        <!-- File Updates -->
        <section class="portal-dashboard__section" aria-labelledby="portal-updates">
          <h3 id="portal-updates" class="portal-dashboard__title">تحديثات الملفات</h3>
          <div class="portal-dashboard__list">
            @for (activity of activities(); track activity.id) {
              <div class="portal-dashboard__item" [class]="'portal-dashboard__item--' + activity.type">
                <div class="portal-dashboard__icon" aria-hidden="true">
                  @if (activity.type === 'update') { 📋 }
                  @else if (activity.type === 'document') { 📄 }
                  @else { 📅 }
                </div>
                <div class="portal-dashboard__info">
                  <span class="portal-dashboard__item-title">{{ activity.title }}</span>
                  <span class="portal-dashboard__item-date">{{ activity.date }}</span>
                  @if (activity.description) {
                    <p class="portal-dashboard__item-desc">{{ activity.description }}</p>
                  }
                </div>
              </div>
            } @empty {
              <p class="portal-dashboard__empty">لا توجد نشاطات حديثة</p>
            }
          </div>
        </section>

        <!-- Upcoming Sessions -->
        <section class="portal-dashboard__section" aria-labelledby="portal-sessions">
          <h3 id="portal-sessions" class="portal-dashboard__title">الجلسات القادمة</h3>
          <div class="portal-dashboard__sessions">
            @for (session of upcomingSessions(); track session.id) {
              <div class="portal-dashboard__session">
                <div class="portal-dashboard__session-date">{{ session.date }}</div>
                <div class="portal-dashboard__session-info">
                  <span class="portal-dashboard__session-title">{{ session.title }}</span>
                  @if (session.location) {
                    <span class="portal-dashboard__session-location">{{ session.location }}</span>
                  }
                </div>
              </div>
            } @empty {
              <p class="portal-dashboard__empty">لا توجد جلسات قادمة</p>
            }
          </div>
        </section>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .portal-login { display: flex; align-items: center; justify-content: center; min-height: 400px; padding: var(--space-8); }
    .portal-login__card { background: var(--clr-white); border: 1px solid var(--clr-border); border-radius: var(--radius-xl); padding: var(--space-8); width: 100%; max-width: 400px; text-align: center; }
    .portal-login__card h2 { font-size: var(--text-xl); font-weight: var(--font-bold); color: var(--clr-secondary); margin: 0 0 var(--space-2); }
    .portal-login__card p { font-size: var(--text-sm); color: var(--clr-text-muted); margin: 0 0 var(--space-6); }
    .portal-login__form { display: flex; flex-direction: column; gap: var(--space-4); }
    .portal-login__field { display: flex; flex-direction: column; gap: var(--space-1); text-align: right; }
    .portal-login__field label { font-size: var(--text-sm); font-weight: var(--font-semibold); color: var(--clr-text-secondary); }
    .portal-login__input { padding: var(--space-3) var(--space-4); border: 1.5px solid var(--clr-border); border-radius: var(--radius-md); font-size: var(--text-base); color: var(--clr-secondary); outline: none; transition: border-color var(--transition-fast); }
    .portal-login__input:focus { border-color: var(--clr-primary); }
    .portal-login__btn { padding: var(--space-3) var(--space-6); border: none; border-radius: var(--radius-md); background: var(--clr-primary); color: white; font-size: var(--text-base); font-weight: var(--font-semibold); cursor: pointer; transition: all var(--transition); }
    .portal-login__btn:hover:not(:disabled) { background: var(--clr-primary-hover); }
    .portal-login__btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .portal-dashboard { padding: var(--space-6); }
    .portal-dashboard__header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-8); padding-bottom: var(--space-4); border-bottom: 1px solid var(--clr-border); }
    .portal-dashboard__header h2 { font-size: var(--text-xl); font-weight: var(--font-bold); color: var(--clr-secondary); margin: 0; }
    .portal-dashboard__header p { font-size: var(--text-sm); color: var(--clr-text-muted); margin: var(--space-1) 0 0; }
    .portal-dashboard__logout { padding: var(--space-2) var(--space-4); border: 1px solid var(--clr-border); border-radius: var(--radius-sm); background: transparent; color: var(--clr-text-secondary); font-size: var(--text-sm); cursor: pointer; transition: all var(--transition-fast); }
    .portal-dashboard__logout:hover { border-color: var(--clr-error); color: var(--clr-error); }
    .portal-dashboard__section { margin-bottom: var(--space-8); }
    .portal-dashboard__title { font-size: var(--text-lg); font-weight: var(--font-bold); color: var(--clr-secondary); margin: 0 0 var(--space-4); }
    .portal-dashboard__list { display: flex; flex-direction: column; gap: var(--space-2); }
    .portal-dashboard__item { display: flex; align-items: flex-start; gap: var(--space-3); padding: var(--space-4) var(--space-5); border: 1px solid var(--clr-border); border-radius: var(--radius-lg); background: var(--clr-white); }
    .portal-dashboard__item--update { border-right: 3px solid var(--clr-accent-blue); }
    .portal-dashboard__item--document { border-right: 3px solid var(--clr-accent-green); }
    .portal-dashboard__item--session { border-right: 3px solid var(--clr-accent-amber); }
    .portal-dashboard__icon { font-size: 1.25rem; flex-shrink: 0; }
    .portal-dashboard__info { flex: 1; }
    .portal-dashboard__item-title { display: block; font-size: var(--text-md); font-weight: var(--font-semibold); color: var(--clr-secondary); }
    .portal-dashboard__item-date { display: block; font-size: var(--text-xs); color: var(--clr-text-muted); }
    .portal-dashboard__item-desc { font-size: var(--text-sm); color: var(--clr-text-secondary); margin: var(--space-1) 0 0; }
    .portal-dashboard__sessions { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: var(--space-4); }
    .portal-dashboard__session { display: flex; gap: var(--space-3); padding: var(--space-4); border: 1px solid var(--clr-border); border-radius: var(--radius-lg); background: var(--clr-white); }
    .portal-dashboard__session-date { font-size: var(--text-sm); font-weight: var(--font-bold); color: var(--clr-accent-amber); white-space: nowrap; }
    .portal-dashboard__session-info { flex: 1; }
    .portal-dashboard__session-title { display: block; font-size: var(--text-sm); font-weight: var(--font-semibold); color: var(--clr-secondary); }
    .portal-dashboard__session-location { display: block; font-size: var(--text-xs); color: var(--clr-text-muted); }
    .portal-dashboard__empty { font-size: var(--text-sm); color: var(--clr-text-muted); text-align: center; padding: var(--space-6); }

    /* Mobile */
    @media (max-width: 767px) {
      .portal-dashboard { padding: var(--space-4); }
      .portal-dashboard__header { flex-direction: column; gap: var(--space-3); }
      .portal-dashboard__sessions { grid-template-columns: 1fr; }
      .portal-dashboard__item { flex-direction: column; gap: var(--space-2); }
    }
  `],
})
export class ClientPortalComponent {
  private events = inject(EventService);
  private auth = inject(AuthService);

  isLoggedIn = signal(false);
  clientName = signal('');
  lastLogin = signal('');
  email = '';
  password = '';

  activities = signal<PortalActivity[]>([
    { id: 1, type: 'update', title: 'تحديث حالة الملف', date: '2025-04-05', description: 'تم تحديث حالة الملف إلى قيد المراجعة' },
    { id: 2, type: 'document', title: 'وثيقة جديدة', date: '2025-04-03', description: 'تم إضافة وثيقة جديدة إلى الملف' },
    { id: 3, type: 'session', title: 'جلسة قادمة', date: '2025-04-10', description: 'المحكمة التجارية - الساعة 10:00' },
  ]);

  upcomingSessions = signal([
    { id: 1, title: 'جلسة المحكمة التجارية', date: '2025-04-10', location: 'المحكمة التجارية' },
    { id: 2, title: 'استشارة قانونية', date: '2025-04-15', location: 'المكتب' },
  ]);

  portalActivity = output<{ type: string; clientId: number }>();

  onLogin() {
    // Simulate login - replace with actual auth
    this.isLoggedIn.set(true);
    this.clientName.set('محمد بن علي');
    this.lastLogin.set('2025-04-05 09:30');
    this.email = '';
    this.password = '';

    // Emit portal activity
    this.events.emit(AppEventType.CLIENT_PORTAL_UPDATE, { clientId: 1 });
    this.portalActivity.emit({ type: 'login', clientId: 1 });
  }

  onLogout() {
    this.isLoggedIn.set(false);
    this.clientName.set('');
    this.lastLogin.set('');
    this.auth.logout();
  }
}
