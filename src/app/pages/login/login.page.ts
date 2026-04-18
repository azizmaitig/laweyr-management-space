import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { take } from 'rxjs';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';
import { PlatformSessionService } from '../../features/platform/services/platform-session.service';
import { InviteApiService, PENDING_SUB_ACCOUNT_INVITE_KEY } from '../../core/services/invite-api.service';

export interface AssistantDemoPersona {
  label: string;
  platformUserId: number;
  profile: {
    name: string;
    email: string;
    title: string;
    barNumber: string;
    specialization: string;
  };
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatCheckboxModule, MatProgressSpinnerModule, MatSnackBarModule,
    MatMenuModule,
  ],
  template: `
    <div class="login-page">
      <!-- Left side - Branding -->
      <div class="brand-side">
        <div class="brand-content">
          <div class="brand-logo">
            <svg width="64" height="64" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="18" fill="rgba(255,255,255,0.2)"/>
              <text x="18" y="24" text-anchor="middle" fill="white" font-size="16" font-weight="bold">⚖</text>
            </svg>
          </div>
          <h1>Ordre Régional des Avocats de Nabeul</h1>
          <p class="brand-ar">الفرع الجهوي للمحامين بنابل</p>
          <div class="brand-features">
            <div class="feature">
              <mat-icon>gavel</mat-icon>
              <span>Gestion des dossiers</span>
            </div>
            <div class="feature">
              <mat-icon>calendar_today</mat-icon>
              <span>Agenda interactif</span>
            </div>
            <div class="feature">
              <mat-icon>payments</mat-icon>
              <span>Suivi des honoraires</span>
            </div>
            <div class="feature">
              <mat-icon>people</mat-icon>
              <span>Espace clients</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right side - Login Form -->
      <div class="form-side">
        <div class="form-container">
          <a routerLink="/" class="back-link">
            <mat-icon>arrow_back</mat-icon>
            Retour à l'accueil
          </a>

          <div class="form-header">
            <h2>Espace Avocat</h2>
            <p>Connectez-vous pour accéder à votre espace de travail</p>
            @if (hasPendingSubAccountInvite()) {
              <p class="invite-hint">لديك دعوة حساب فرعي: سجّل الدخول لتفعيلها بعد قبول الرابط.</p>
            }
          </div>

          <form [formGroup]="loginForm" (ngSubmit)="onLogin()" class="login-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Adresse email</mat-label>
              <mat-icon matPrefix>email</mat-icon>
              <input matInput formControlName="email" type="email" placeholder="avocat@exemple.com" autocomplete="email">
              @if (loginForm.get('email')?.hasError('required') && loginForm.get('email')?.touched) {
                <mat-error>L'email est requis</mat-error>
              }
              @if (loginForm.get('email')?.hasError('email') && loginForm.get('email')?.touched) {
                <mat-error>Format d'email invalide</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Mot de passe</mat-label>
              <mat-icon matPrefix>lock</mat-icon>
              <input matInput formControlName="password" type="password" placeholder="••••••••" autocomplete="current-password">
              @if (loginForm.get('password')?.hasError('required') && loginForm.get('password')?.touched) {
                <mat-error>Le mot de passe est requis</mat-error>
              }
            </mat-form-field>

            <div class="form-options">
              <mat-checkbox formControlName="rememberMe">Se souvenir de moi</mat-checkbox>
              <a href="#" class="forgot-link">Mot de passe oublié ?</a>
            </div>

            <button mat-flat-button type="submit" [disabled]="loginForm.invalid || loading" class="login-btn">
              @if (loading) {
                <mat-spinner diameter="22"></mat-spinner>
              } @else {
                <mat-icon>login</mat-icon>
                Se connecter
              }
            </button>

            <div class="divider">
              <span>ou</span>
            </div>

            <button mat-stroked-button type="button" (click)="demoLogin()" [disabled]="loading" class="demo-btn">
              <mat-icon>visibility</mat-icon>
              Connexion démo
            </button>

            <button
              mat-stroked-button
              type="button"
              [matMenuTriggerFor]="assistantDemoMenu"
              [disabled]="loading"
              class="assistant-demo-btn"
            >
              <mat-icon>badge</mat-icon>
              Assistant démo
              <mat-icon class="menu-chevron">expand_more</mat-icon>
            </button>
            <mat-menu #assistantDemoMenu="matMenu">
              <button mat-menu-item type="button" (click)="assistantDemoLogin(assistantDemoPersonas[0])">
                <mat-icon>support_agent</mat-icon>
                <span>{{ assistantDemoPersonas[0].label }}</span>
              </button>
              <button mat-menu-item type="button" (click)="assistantDemoLogin(assistantDemoPersonas[1])">
                <mat-icon>description</mat-icon>
                <span>{{ assistantDemoPersonas[1].label }}</span>
              </button>
              <button mat-menu-item type="button" (click)="assistantDemoLogin(assistantDemoPersonas[2])">
                <mat-icon>admin_panel_settings</mat-icon>
                <span>{{ assistantDemoPersonas[2].label }}</span>
              </button>
            </mat-menu>

            <button mat-stroked-button type="button" (click)="clientPortalLogin()" class="client-portal-btn">
              <mat-icon>person</mat-icon>
              Espace Client démo
            </button>
          </form>

          <p class="form-footer">
            Pas encore inscrit ?
            <a routerLink="/contact">Contactez l'ordre des avocats</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      display: flex;
      min-height: 100vh;
    }

    /* Brand Side */
    .brand-side {
      flex: 1;
      background: linear-gradient(135deg, #0f2d5e 0%, #1a3a6e 50%, #ea3f48 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      position: relative;
      overflow: hidden;
    }
    .brand-side::before {
      content: '';
      position: absolute;
      inset: 0;
      background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    }
    .brand-content {
      position: relative;
      z-index: 1;
      max-width: 450px;
    }
    .brand-logo {
      margin-bottom: 2rem;
    }
    .brand-side h1 {
      font-size: 1.75rem;
      font-weight: 800;
      margin: 0 0 0.5rem;
      line-height: 1.3;
    }
    .brand-ar {
      font-size: 1.1rem;
      opacity: 0.8;
      margin: 0 0 2.5rem;
      direction: rtl;
    }
    .brand-features {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .feature {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 0.75rem 1rem;
      backdrop-filter: blur(10px);
    }
    .feature mat-icon {
      color: #ea3f48;
      font-size: 22px;
      width: 22px;
      height: 22px;
    }
    .feature span {
      font-size: 0.85rem;
      font-weight: 500;
    }

    /* Form Side */
    .form-side {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: #f8fafc;
    }
    .form-container {
      width: 100%;
      max-width: 420px;
    }
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      color: #64748b;
      text-decoration: none;
      font-size: 0.85rem;
      font-weight: 500;
      margin-bottom: 2rem;
      transition: color 0.2s;
    }
    .back-link:hover { color: #ea3f48; }
    .back-link mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .form-header {
      margin-bottom: 2rem;
    }
    .form-header h2 {
      font-size: 1.75rem;
      font-weight: 800;
      color: #0f2d5e;
      margin: 0 0 0.5rem;
    }
    .form-header p {
      color: #64748b;
      margin: 0;
      font-size: 0.95rem;
    }
    .invite-hint {
      margin-top: 0.65rem !important;
      padding: 0.5rem 0.65rem;
      border-radius: 8px;
      background: #eef2ff;
      border: 1px solid #c7d2fe;
      color: #3730a3 !important;
      font-size: 0.82rem !important;
      line-height: 1.4;
    }

    .login-form {
      display: flex;
      flex-direction: column;
    }
    .full-width {
      width: 100%;
    }
    .form-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    .forgot-link {
      color: #ea3f48;
      font-size: 0.85rem;
      font-weight: 600;
      text-decoration: none;
    }
    .forgot-link:hover { text-decoration: underline; }

    .login-btn {
      height: 48px;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 700;
      background: linear-gradient(135deg, #ea3f48, #c8333d) !important;
    }
    .login-btn mat-icon { margin-right: 0.5rem; }

    .divider {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin: 1.5rem 0;
    }
    .divider::before, .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: #e2e8f0;
    }
    .divider span {
      color: #94a3b8;
      font-size: 0.85rem;
    }

    .demo-btn {
      height: 44px;
      border-radius: 12px;
      font-weight: 600;
      border-color: #e2e8f0 !important;
      color: #475569 !important;
    }
    .demo-btn mat-icon { margin-right: 0.5rem; }

    .assistant-demo-btn {
      height: 44px;
      border-radius: 12px;
      font-weight: 600;
      border-color: #c7d2fe !important;
      color: #3730a3 !important;
      margin-top: 0.5rem;
    }
    .assistant-demo-btn mat-icon:first-of-type { margin-right: 0.5rem; }
    .assistant-demo-btn .menu-chevron {
      margin-left: auto;
      margin-right: 0;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .client-portal-btn {
      height: 44px;
      border-radius: 12px;
      font-weight: 600;
      border-color: #ccfbf1 !important;
      color: #0d9488 !important;
      margin-top: 0.5rem;
    }
    .client-portal-btn mat-icon { margin-right: 0.5rem; }

    .form-footer {
      text-align: center;
      margin-top: 2rem;
      color: #64748b;
      font-size: 0.9rem;
    }
    .form-footer a {
      color: #ea3f48;
      font-weight: 600;
      text-decoration: none;
    }
    .form-footer a:hover { text-decoration: underline; }

    @media (max-width: 1024px) {
      .brand-side { display: none; }
      .form-side { flex: 1; }
    }
  `],
})
export class LoginPage implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private platformSession = inject(PlatformSessionService);
  private inviteApi = inject(InviteApiService);

  ngOnInit(): void {
    this.route.queryParamMap.pipe(take(1)).subscribe(params => {
      const invite = params.get('invite')?.trim();
      if (invite) {
        sessionStorage.setItem(PENDING_SUB_ACCOUNT_INVITE_KEY, invite);
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { invite: null },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      }
    });
  }

  hasPendingSubAccountInvite(): boolean {
    return typeof sessionStorage !== 'undefined' && !!sessionStorage.getItem(PENDING_SUB_ACCOUNT_INVITE_KEY);
  }

  /** After lawyer/assistant auth — activates PENDING sub-account (demo + real API). */
  private consumePendingSubAccountInvite(): void {
    const token = sessionStorage.getItem(PENDING_SUB_ACCOUNT_INVITE_KEY);
    if (!token) return;
    this.inviteApi.acceptInvite(token).subscribe({
      next: () => {
        sessionStorage.removeItem(PENDING_SUB_ACCOUNT_INVITE_KEY);
        this.snackBar.open('تم تفعيل الدعوة — الحساب الفرعي نشط الآن', 'OK', { duration: 4000 });
      },
      error: (err: { message?: string }) => {
        this.snackBar.open(err?.message ?? 'تعذر تفعيل الدعوة', 'OK', { duration: 5000 });
      },
    });
  }

  loading = false;

  /** Distinct demo identities for assistants / clerical staff (platform actor + profile). */
  readonly assistantDemoPersonas: AssistantDemoPersona[] = [
    {
      label: 'Sonia — Assistante juridique',
      platformUserId: 201,
      profile: {
        name: 'Sonia Ben Ammar',
        email: 'sonia.benammar@cabinet-demo.tn',
        title: 'Assistante juridique',
        barNumber: '—',
        specialization: 'Soutien dossiers & audiences',
      },
    },
    {
      label: 'Karim — Assistant (greffe)',
      platformUserId: 202,
      profile: {
        name: 'Karim Trabelsi',
        email: 'karim.trabelsi@cabinet-demo.tn',
        title: 'Assistant greffe',
        barNumber: '—',
        specialization: 'Formalités & délais',
      },
    },
    {
      label: 'Leïla — Clerc / secrétariat',
      platformUserId: 203,
      profile: {
        name: 'Leïla Mansour',
        email: 'leila.mansour@cabinet-demo.tn',
        title: 'Clerc',
        barNumber: '—',
        specialization: 'Secrétariat & suivi client',
      },
    },
  ];

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false],
  });

  onLogin() {
    if (this.loginForm.invalid) return;
    this.loading = true;
    setTimeout(() => {
      this.platformSession.setActorUserId(null);
      this.auth.login({ email: this.loginForm.value.email ?? '' });
      this.loading = false;
      this.consumePendingSubAccountInvite();
      this.router.navigate(['/espace-avocat']);
    }, 1500);
  }

  demoLogin() {
    this.loading = true;
    setTimeout(() => {
      this.platformSession.setActorUserId(null);
      this.auth.login();
      this.loading = false;
      this.consumePendingSubAccountInvite();
      this.router.navigate(['/espace-avocat']);
    }, 1000);
  }

  /**
   * Demo entry for lawyer assistants / clerical roles: same espace avocat shell,
   * distinct user profile + {@link PlatformSessionService} actor for platform features.
   */
  assistantDemoLogin(persona: AssistantDemoPersona) {
    this.loading = true;
    setTimeout(() => {
      this.platformSession.setActorUserId(persona.platformUserId);
      this.auth.login(persona.profile);
      this.loading = false;
      this.consumePendingSubAccountInvite();
      this.snackBar.open(`Espace assistant : ${persona.profile.name}`, 'OK', { duration: 3500 });
      this.router.navigate(['/espace-avocat', 'dashboard']);
    }, 600);
  }

  clientPortalLogin() {
    this.loading = true;
    setTimeout(() => {
      this.platformSession.setActorUserId(null);
      this.auth.login();
      this.loading = false;
      this.router.navigate(['/client-portal']);
    }, 1000);
  }
}
