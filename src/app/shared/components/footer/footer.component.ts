import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterModule, MatIconModule],
  template: `
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-col">
            <h3>Ordre Régional des Avocats de Nabeul</h3>
            <p class="subtitle">الفرع الجهوي للمحامين بنابل</p>
          </div>
          <div class="footer-col">
            <h4>Contact</h4>
            <p><mat-icon>location_on</mat-icon> {{ t('footer.address') }}</p>
            <p><mat-icon>phone</mat-icon> {{ t('footer.phone') }}</p>
            <p><mat-icon>email</mat-icon> {{ t('footer.email') }}</p>
          </div>
          <div class="footer-col">
            <h4>Liens Rapides</h4>
            <a routerLink="/annuaire-avocats">{{ t('nav.directory') }}</a>
            <a routerLink="/actualites">{{ t('nav.news') }}</a>
            <a routerLink="/contact">{{ t('nav.contact') }}</a>
          </div>
        </div>
        <div class="footer-bottom">
          <p>{{ t('footer.rights') }}</p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background: linear-gradient(135deg, #0f2d5e, #1a3a6e);
      color: white;
      padding: 3rem 0 1.5rem;
      margin-top: 4rem;
    }
    .container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 1rem;
    }
    .footer-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      margin-bottom: 2rem;
    }
    .footer-col h3 {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 0 0 0.25rem;
    }
    .footer-col .subtitle {
      color: #94a3b8;
      margin: 0;
      font-size: 0.9rem;
    }
    .footer-col h4 {
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 1rem;
      color: #ea3f48;
    }
    .footer-col p {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #cbd5e1;
      margin: 0.5rem 0;
      font-size: 0.9rem;
    }
    .footer-col p mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .footer-col a {
      display: block;
      color: #cbd5e1;
      text-decoration: none;
      padding: 0.25rem 0;
      font-size: 0.9rem;
      transition: color 0.2s;
    }
    .footer-col a:hover {
      color: #ea3f48;
    }
    .footer-bottom {
      border-top: 1px solid rgba(255,255,255,0.1);
      padding-top: 1.5rem;
      text-align: center;
      color: #64748b;
      font-size: 0.85rem;
    }
  `],
})
export class FooterComponent {
  private translation = inject(TranslationService);
  t(key: string): string {
    return this.translation.t(key);
  }
}
