import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatToolbarModule, MatMenuModule],
  template: `
    <mat-toolbar class="navbar">
      <div class="container">
        <div class="logo-section">
          <div class="logo">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="18" fill="#ea3f48"/>
              <text x="18" y="24" text-anchor="middle" fill="white" font-size="16" font-weight="bold">⚖</text>
            </svg>
          </div>
          <span class="org-name">Ordre des Avocats de Nabeul</span>
        </div>

        <div class="nav-links" [class.mobile-hidden]="false">
          <a mat-button routerLink="/" routerLinkActive="active-link" [routerLinkActiveOptions]="{exact: true}">
            {{ t('nav.home') }}
          </a>
          <a mat-button routerLink="/annuaire-avocats" routerLinkActive="active-link">
            {{ t('nav.directory') }}
          </a>
          <a mat-button routerLink="/actualites" routerLinkActive="active-link">
            {{ t('nav.news') }}
          </a>
          <a mat-button routerLink="/textes-juridiques" routerLinkActive="active-link">
            {{ t('nav.legal') }}
          </a>
          <a mat-button routerLink="/evenements" routerLinkActive="active-link">
            {{ t('nav.events') }}
          </a>
          <a mat-button routerLink="/contact" routerLinkActive="active-link">
            {{ t('nav.contact') }}
          </a>
        </div>

        <div class="actions">
          <button mat-button class="lang-toggle" (click)="toggleLang()">
            {{ lang() === 'fr' ? 'AR' : 'FR' }}
          </button>
          <a mat-flat-button routerLink="/espace-avocat" class="lawyer-link">
            <mat-icon>gavel</mat-icon>
            {{ t('nav.lawyerSpace') }}
          </a>
        </div>
      </div>
    </mat-toolbar>
  `,
  styles: [`
    .navbar {
      background: var(--clr-surface);
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      position: sticky;
      top: 0;
      z-index: 100;
      height: auto;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--clr-border);
    }
    .container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 1rem;
    }
    .logo-section {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .org-name {
      font-weight: 700;
      font-size: 1rem;
      color: var(--clr-text);
    }
    .nav-links {
      display: flex;
      gap: 0.25rem;
    }
    .nav-links .mat-mdc-button {
      color: var(--clr-text-secondary);
      font-weight: 500;
    }
    .nav-links .mat-mdc-button:hover {
      color: #ea3f48;
    }
    .active-link {
      color: #ea3f48 !important;
      border-bottom: 2px solid #ea3f48;
    }
    .actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .lang-toggle {
      min-width: 48px !important;
      border: 2px solid var(--clr-border) !important;
      border-radius: 8px !important;
      font-weight: 600 !important;
      color: var(--clr-text) !important;
    }
    .lawyer-link {
      background: linear-gradient(135deg, #ea3f48, #c8333d) !important;
      color: white !important;
      border-radius: 8px !important;
      font-weight: 600 !important;
    }
    @media (max-width: 1024px) {
      .nav-links { display: none; }
    }
  `],
})
export class NavbarComponent {
  lang = input<'fr' | 'ar'>('fr');
  langChange = output<'fr' | 'ar'>();

  private translation = inject(TranslationService);

  t(key: string): string {
    return this.translation.t(key);
  }

  toggleLang() {
    const newLang = this.lang() === 'fr' ? 'ar' : 'fr';
    this.translation.setLang(newLang);
    this.langChange.emit(newLang);
  }
}
