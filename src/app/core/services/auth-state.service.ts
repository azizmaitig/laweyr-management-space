import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, tap, catchError, of, map } from 'rxjs';
import { AuthApiService, LoginDto, RegisterDto } from './auth-api.service';
import { EventService } from './event.service';
import { AppEventType } from '../models/events.model';

export interface User {
  id: number;
  name: string;
  email: string;
  barNumber: string;
  specialization: string;
  roles: string[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private api = inject(AuthApiService);
  private events = inject(EventService);

  private state = new BehaviorSubject<AuthState>(this.loadFromStorage() || initialState);
  state$ = this.state.asObservable();

  // Selectors
  selectUser(): Observable<User | null> {
    return this.state$.pipe(map(s => s.user));
  }

  selectIsAuthenticated(): Observable<boolean> {
    return this.state$.pipe(map(s => s.isAuthenticated));
  }

  selectLoading(): Observable<boolean> {
    return this.state$.pipe(map(s => s.loading));
  }

  selectError(): Observable<string | null> {
    return this.state$.pipe(map(s => s.error));
  }

  // Getters (sync)
  get user(): User | null { return this.state.value.user; }
  get isAuthenticated(): boolean { return this.state.value.isAuthenticated; }
  get token(): string | null { return this.state.value.token; }

  // Actions
  login(dto: LoginDto) {
    this.patchState({ loading: true, error: null });
    return this.api.login(dto).pipe(
      tap(response => {
        const authState: AuthState = {
          user: response.user,
          token: response.token,
          isAuthenticated: true,
          loading: false,
          error: null,
        };
        this.patchState(authState);
        this.saveToStorage(authState);
        this.events.emit(AppEventType.AUTH_LOGIN, response.user.id);
      }),
      catchError(err => {
        this.patchState({ loading: false, error: err.error?.message || 'Login failed' });
        this.events.emit(AppEventType.AUTH_ERROR, err.error?.message);
        return of(null);
      })
    );
  }

  register(dto: RegisterDto) {
    this.patchState({ loading: true, error: null });
    return this.api.register(dto).pipe(
      tap(response => {
        const authState: AuthState = {
          user: response.user,
          token: response.token,
          isAuthenticated: true,
          loading: false,
          error: null,
        };
        this.patchState(authState);
        this.saveToStorage(authState);
        this.events.emit(AppEventType.AUTH_REGISTER, response.user.id);
      }),
      catchError(err => {
        this.patchState({ loading: false, error: err.error?.message || 'Registration failed' });
        return of(null);
      })
    );
  }

  logout() {
    this.api.logout().pipe(
      tap(() => {
        this.patchState(initialState);
        this.clearStorage();
        this.events.emit(AppEventType.AUTH_LOGOUT);
      }),
      catchError(() => {
        this.patchState(initialState);
        this.clearStorage();
        this.events.emit(AppEventType.AUTH_LOGOUT);
        return of(null);
      })
    ).subscribe();
  }

  hasRole(role: string): boolean {
    return this.state.value.user?.roles.includes(role) ?? false;
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some(r => this.hasRole(r));
  }

  private patchState(partial: Partial<AuthState>) {
    const current = this.state.value;
    this.state.next({ ...current, ...partial });
  }

  private saveToStorage(state: AuthState) {
    if (typeof window !== 'undefined' && state.token) {
      localStorage.setItem('auth_state', JSON.stringify({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }));
    }
  }

  private loadFromStorage(): AuthState | null {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('auth_state');
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored);
      return { ...parsed, loading: false, error: null };
    } catch {
      return null;
    }
  }

  private clearStorage() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_state');
    }
  }
}
