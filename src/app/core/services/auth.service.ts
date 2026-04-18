import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LawyerProfile } from '../models/lawyer.model';
import { PlatformSessionService } from '../../features/platform/services/platform-session.service';

const MOCK_PROFILE: LawyerProfile = {
  name: 'Maître Ahmed Ben Ali',
  barNumber: 'B-12345',
  specialization: 'Droit des affaires',
  email: 'ahmed.benali@avocat.tn',
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);
  private platformSession = inject(PlatformSessionService);

  private isAuthenticated = signal(false);
  private currentUser = signal<LawyerProfile | null>(null);

  authStatus = this.isAuthenticated.asReadonly();
  user = this.currentUser.asReadonly();

  isLoggedIn = computed(() => this.isAuthenticated());

  login(profile?: Partial<LawyerProfile>): void {
    this.currentUser.set({ ...MOCK_PROFILE, ...profile } as LawyerProfile);
    this.isAuthenticated.set(true);
  }

  logout(): void {
    this.platformSession.setActorUserId(null);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    void this.router.navigate(['/login']);
  }

  getMockProfile(): LawyerProfile {
    return MOCK_PROFILE;
  }
}
