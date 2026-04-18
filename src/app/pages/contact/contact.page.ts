import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule],
  template: `
    <div class="contact-page">

      <!-- ════════════════════════════════════════════ -->
      <!-- PAGE HEADER                                    -->
      <!-- ════════════════════════════════════════════ -->
      <section class="page-header">
        <div class="page-header__pattern"></div>
        <div class="page-header__content">
          <h1>اتصل بنا</h1>
          <p>نحن في خدمتكم لأي استفسار أو طلب</p>
        </div>
      </section>

      <!-- ════════════════════════════════════════════ -->
      <!-- CONTACT GRID                                   -->
      <!-- ════════════════════════════════════════════ -->
      <section class="contact-section">
        <div class="contact-grid">

          <!-- Info Card -->
          <div class="info-card">
            <div class="info-card__header">
              <div class="info-card__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <h3>معلومات الاتصال</h3>
            </div>
            <div class="info-card__body">
              <div class="info-item">
                <div class="info-item__icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <div class="info-item__text">
                  <span class="info-item__label">العنوان</span>
                  <span class="info-item__value">شارع الحبيب بورقيبة، نابل، تونس</span>
                </div>
              </div>
              <div class="info-item">
                <div class="info-item__icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </div>
                <div class="info-item__text">
                  <span class="info-item__label">الهاتف</span>
                  <span class="info-item__value" dir="ltr">+216 72 285 XXX</span>
                </div>
              </div>
              <div class="info-item">
                <div class="info-item__icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </div>
                <div class="info-item__text">
                  <span class="info-item__label">البريد الإلكتروني</span>
                  <span class="info-item__value">contact@oranabeul.tn</span>
                </div>
              </div>
            </div>
            <div class="info-card__map">
              <div class="info-card__map-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span>نابل، تونس</span>
              </div>
            </div>
          </div>

          <!-- Form Card -->
          <div class="form-card">
            <div class="form-card__header">
              <h3>أرسلوا رسالة</h3>
              <p>سنرد عليكم في أقرب وقت ممكن</p>
            </div>
            <form [formGroup]="contactForm" (ngSubmit)="onSubmit()" class="contact-form">
              <div class="form-row">
                <div class="form-field">
                  <label class="form-field__label">الاسم الكامل</label>
                  <input matInput formControlName="name" class="form-field__input" placeholder="أدخلوا اسمكم">
                  @if (contactForm.get('name')?.touched && contactForm.get('name')?.invalid) {
                    <span class="form-field__error">الاسم مطلوب</span>
                  }
                </div>
              </div>
              <div class="form-row">
                <div class="form-field">
                  <label class="form-field__label">البريد الإلكتروني</label>
                  <input matInput formControlName="email" type="email" class="form-field__input" placeholder="email@exemple.com" dir="ltr">
                  @if (contactForm.get('email')?.touched && contactForm.get('email')?.hasError('required')) {
                    <span class="form-field__error">البريد الإلكتروني مطلوب</span>
                  }
                  @if (contactForm.get('email')?.touched && contactForm.get('email')?.hasError('email')) {
                    <span class="form-field__error">صيغة البريد غير صحيحة</span>
                  }
                </div>
              </div>
              <div class="form-row">
                <div class="form-field">
                  <label class="form-field__label">الموضوع</label>
                  <input matInput formControlName="subject" class="form-field__input" placeholder="موضوع الرسالة">
                  @if (contactForm.get('subject')?.touched && contactForm.get('subject')?.invalid) {
                    <span class="form-field__error">الموضوع مطلوب</span>
                  }
                </div>
              </div>
              <div class="form-row">
                <div class="form-field">
                  <label class="form-field__label">الرسالة</label>
                  <textarea formControlName="message" class="form-field__textarea" rows="5" placeholder="اكتبوا رسالتكم هنا..."></textarea>
                  @if (contactForm.get('message')?.touched && contactForm.get('message')?.invalid) {
                    <span class="form-field__error">الرسالة مطلوبة</span>
                  }
                </div>
              </div>
              <button type="submit" class="btn btn--primary btn--full" [disabled]="contactForm.invalid || loading">
                @if (loading) {
                  <span class="spinner"></span>
                } @else {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  إرسال الرسالة
                }
              </button>
            </form>
          </div>

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
      --radius-sm: 8px;
      --radius-md: 12px;
      --radius-lg: 16px;
      --radius-xl: 20px;
      --shadow-card: 0 1px 3px rgba(0,0,0,.04), 0 1px 2px rgba(0,0,0,.06);
      --shadow-card-hover: 0 8px 24px rgba(0,0,0,.08), 0 4px 8px rgba(0,0,0,.04);
      --transition: .25s cubic-bezier(.4,0,.2,1);
    }

    .contact-page {
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
       CONTACT GRID
       ═══════════════════════════════════════════════ */
    .contact-section {
      max-width: 1100px;
      margin: 2rem auto;
      padding: 0 1.5rem 3rem;
    }
    .contact-grid {
      display: grid;
      grid-template-columns: 1fr 1.5fr;
      gap: 1.25rem;
    }

    /* Info Card */
    .info-card {
      background: var(--clr-surface);
      border: 1px solid var(--clr-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-card);
      overflow: hidden;
    }
    .info-card__header {
      display: flex;
      align-items: center;
      gap: .65rem;
      padding: 1.25rem 1.25rem 0;
    }
    .info-card__icon {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-sm);
      background: #fef2f2;
      color: var(--clr-brand);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .info-card__icon svg { width: 18px; height: 18px; }
    .info-card__header h3 {
      font-size: .95rem;
      font-weight: 700;
      margin: 0;
      color: var(--clr-text);
    }
    .info-card__body { padding: 1rem 1.25rem; }
    .info-item {
      display: flex;
      align-items: flex-start;
      gap: .65rem;
      padding: .65rem 0;
      border-bottom: 1px solid var(--clr-border);
    }
    .info-item:last-child { border-bottom: none; }
    .info-item__icon {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm);
      background: var(--clr-bg);
      color: var(--clr-text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .info-item__icon svg { width: 15px; height: 15px; }
    .info-item__label {
      display: block;
      font-size: .7rem;
      color: var(--clr-text-muted);
      margin-bottom: .1rem;
    }
    .info-item__value {
      display: block;
      font-size: .85rem;
      font-weight: 600;
      color: var(--clr-text);
    }
    .info-card__map {
      border-top: 1px solid var(--clr-border);
    }
    .info-card__map-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: var(--clr-bg);
      color: var(--clr-text-muted);
      gap: .5rem;
    }
    .info-card__map-placeholder svg {
      width: 32px;
      height: 32px;
      opacity: .4;
    }
    .info-card__map-placeholder span {
      font-size: .82rem;
    }

    /* Form Card */
    .form-card {
      background: var(--clr-surface);
      border: 1px solid var(--clr-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-card);
    }
    .form-card__header {
      padding: 1.25rem 1.5rem 0;
    }
    .form-card__header h3 {
      font-size: 1rem;
      font-weight: 700;
      margin: 0 0 .25rem;
      color: var(--clr-text);
    }
    .form-card__header p {
      font-size: .82rem;
      color: var(--clr-text-muted);
      margin: 0;
    }
    .contact-form {
      padding: 1rem 1.5rem 1.5rem;
    }
    .form-row { margin-bottom: .75rem; }
    .form-field { display: flex; flex-direction: column; gap: .35rem; }
    .form-field__label {
      font-size: .78rem;
      font-weight: 600;
      color: var(--clr-text-secondary);
    }
    .form-field__input,
    .form-field__textarea {
      padding: .65rem .85rem;
      border: 1.5px solid var(--clr-border);
      border-radius: var(--radius-sm);
      font-family: inherit;
      font-size: .88rem;
      background: var(--clr-bg);
      color: var(--clr-text);
      transition: border-color var(--transition), box-shadow var(--transition);
      outline: none;
    }
    .form-field__input:focus,
    .form-field__textarea:focus {
      border-color: var(--clr-brand);
      box-shadow: 0 0 0 3px rgba(234,63,72,.08);
    }
    .form-field__input::placeholder,
    .form-field__textarea::placeholder {
      color: var(--clr-text-muted);
    }
    .form-field__textarea {
      resize: vertical;
      min-height: 120px;
    }
    .form-field__error {
      font-size: .7rem;
      color: var(--clr-brand);
      font-weight: 600;
    }

    /* Button */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: .5rem;
      padding: .7rem 1.5rem;
      border-radius: var(--radius-md);
      font-family: inherit;
      font-size: .9rem;
      font-weight: 700;
      cursor: pointer;
      transition: all var(--transition);
      border: none;
    }
    .btn svg { width: 18px; height: 18px; }
    .btn--primary {
      background: var(--clr-brand);
      color: white;
    }
    .btn--primary:hover:not(:disabled) {
      background: #c8333d;
      transform: translateY(-1px);
    }
    .btn--full { width: 100%; }
    .btn:disabled {
      opacity: .6;
      cursor: not-allowed;
    }
    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255,255,255,.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin .6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Responsive */
    @media (max-width: 768px) {
      .contact-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class ContactPage {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  loading = false;

  contactForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    subject: ['', Validators.required],
    message: ['', Validators.required],
  });

  onSubmit() {
    if (this.contactForm.invalid) return;
    this.loading = true;
    setTimeout(() => {
      this.snackBar.open('تم إرسال الرسالة بنجاح!', 'إغلاق', { duration: 3000 });
      this.contactForm.reset();
      this.loading = false;
    }, 1500);
  }
}
