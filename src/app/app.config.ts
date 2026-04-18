import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { AgendaFeatureInitService } from './features/agenda/agenda-feature-init.service';
import { AnalyticsFeatureInitService } from './features/analytics/services/analytics-feature-init.service';
import { CourtSessionsFeatureInitService } from './features/court-sessions/court-sessions-feature-init.service';
import { FinancialFeatureInitService } from './features/financial/services/financial-feature-init.service';
import { PlatformFeatureInitService } from './features/platform/platform-feature-init.service';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { hearingsDemoInterceptor } from './core/interceptors/hearings-demo.interceptor';
import { lawyerSubAccountsDemoInterceptor } from './core/interceptors/lawyer-sub-accounts-demo.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { SettingsStateService } from './features/platform/services/settings-state.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAppInitializer(() => {
      // Theme must be applied immediately on init.
      inject(SettingsStateService);
      inject(FinancialFeatureInitService);
      inject(CourtSessionsFeatureInitService);
      inject(AnalyticsFeatureInitService);
      inject(PlatformFeatureInitService);
      inject(AgendaFeatureInitService);
    }),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(
      withInterceptors([
        hearingsDemoInterceptor, // Dev: mock cases + court-sessions when environment.hearingsDemo
        lawyerSubAccountsDemoInterceptor, // Dev: mock lawyer sub-accounts API
        loadingInterceptor, // Track loading state
        authInterceptor, // Attach JWT token
        errorInterceptor, // Handle errors globally
      ])
    ),
  ]
};
