import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { TranslationService } from './core/services/translation.service';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { SettingsStateService } from './features/platform/services/settings-state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  template: `
    <div class="app-layout">
      @if (!isEspaceAvocat()) {
        <app-navbar
          [lang]="translation.lang()"
          (langChange)="translation.setLang($event)">
        </app-navbar>
      }

      <main class="main-content">
        <router-outlet></router-outlet>
      </main>

      @if (!isEspaceAvocat()) {
        <app-footer></app-footer>
      }
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    .main-content {
      flex: 1;
    }
  `],
})
export class App implements OnInit, OnDestroy {
  translation = inject(TranslationService);
  router = inject(Router);
  settings = inject(SettingsStateService);

  isEspaceAvocat = signal(false);
  private sub?: Subscription;
  private themeSub?: Subscription;

  ngOnInit() {
    this.checkRoute(this.router.url);
    this.sub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => this.checkRoute(e.urlAfterRedirects));

    // Listen to theme changes (applies globally in SettingsStateService).
    this.themeSub = this.settings.theme$.subscribe();
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.themeSub?.unsubscribe();
  }

  private checkRoute(url: string) {
    this.isEspaceAvocat.set(url.startsWith('/espace-avocat'));
  }
}
