import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Public routes
  {
    path: '',
    loadComponent: () => import('./pages/home/home.page').then(m => m.HomePage),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage),
  },
  {
    path: 'annuaire-avocats',
    loadComponent: () => import('./pages/lawyer-directory/lawyer-directory.page').then(m => m.LawyerDirectoryPage),
  },
  {
    path: 'actualites',
    loadComponent: () => import('./pages/news/news.page').then(m => m.NewsPage),
  },
  {
    path: 'textes-juridiques',
    loadComponent: () => import('./pages/legal-texts/legal-texts.page').then(m => m.LegalTextsPage),
  },
  {
    path: 'evenements',
    loadComponent: () => import('./pages/events/events.page').then(m => m.EventsPage),
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact.page').then(m => m.ContactPage),
  },

  // Protected: Espace Avocat (requires auth)
  {
    path: 'espace-avocat',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/espace-avocat-shell/espace-avocat-shell.page').then(m => m.EspaceAvocatShellPage),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      // From Espace Avocat
      { path: 'cases', loadComponent: () => import('./pages/ea-cases/ea-cases.page').then(m => m.EACasesPage) },
      { path: 'clients', loadComponent: () => import('./pages/ea-clients/ea-clients.page').then(m => m.EAClientsPage) },
      { path: 'finance', loadComponent: () => import('./pages/ea-finance/ea-finance.page').then(m => m.EAFinancePage) },
      { path: 'hearings', loadComponent: () => import('./pages/ea-hearings/ea-hearings.page').then(m => m.EAHearingsPage) },
      { path: 'stats', loadComponent: () => import('./pages/ea-stats/ea-stats.page').then(m => m.EAStatsPage) },
      { path: 'settings', loadComponent: () => import('./pages/settings/settings-page.component').then(m => m.SettingsPageComponent) },
      { path: 'users-admin', loadComponent: () => import('./pages/users-admin/users-admin-page.component').then(m => m.UsersAdminPageComponent) },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.page').then(m => m.DashboardPage) },
      { path: 'agenda', loadComponent: () => import('./features/agenda/components/agenda-dashboard/agenda-dashboard.component').then(m => m.AgendaDashboardComponent) },
      { path: 'notifications', loadComponent: () => import('./features/notifications/notifications.page').then(m => m.NotificationsPage) },
      { path: 'files', redirectTo: 'settings', pathMatch: 'full' },
    ],
  },

  // Client Portal (public, separate from lawyer auth)
  {
    path: 'client-portal',
    loadComponent: () => import('./features/clients/components/client-portal/client-portal.component').then(m => m.ClientPortalComponent),
  },

  // Wildcard
  { path: '**', redirectTo: '' },
];
