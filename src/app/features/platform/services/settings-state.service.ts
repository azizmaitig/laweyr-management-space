import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject, Observable, catchError, distinctUntilChanged, map, of, tap } from 'rxjs';
import type { ThemePreference, UserNotificationPreferences, UserSettings } from '../../../core/models';
import { AppEventType } from '../../../core/models/events.model';
import type { SettingsUpdatedPayload, ThemeUpdatedPayload } from '../../../core/models/platform-events.model';
import { EventService } from '../../../core/services/event.service';
import { SettingsApiService } from './settings-api.service';

export type AppTheme = 'LIGHT' | 'DARK';
export type CompactModePreference = 'ON' | 'OFF';

export interface SettingsState {
  /** Last loaded settings per user */
  byUserId: Record<number, UserSettings>;
  loading: boolean;
  error: string | null;
  activeUserId: number | null;
  /** App-level theme (not per-user API setting). */
  theme: AppTheme;
  compactMode: CompactModePreference;
}

const initialState: SettingsState = {
  byUserId: {},
  loading: false,
  error: null,
  activeUserId: null,
  theme: 'LIGHT',
  compactMode: 'OFF',
};

@Injectable({ providedIn: 'root' })
export class SettingsStateService {
  private readonly themeStorageKey = 'app_theme';
  private readonly compactStorageKey = 'app_compact_mode';
  private api = inject(SettingsApiService);
  private events = inject(EventService);
  private doc = inject(DOCUMENT);

  private state = new BehaviorSubject<SettingsState>(initialState);
  state$ = this.state.asObservable();

  /** Current app theme (LIGHT/DARK). */
  theme$: Observable<AppTheme> = this.state$.pipe(
    map(s => s.theme),
    distinctUntilChanged()
  );

  compactMode$: Observable<CompactModePreference> = this.state$.pipe(
    map(s => s.compactMode),
    distinctUntilChanged()
  );

  constructor() {
    // Apply theme as early as possible (service is constructed during app init).
    const saved = this.readPersistedTheme();
    this.patchState({ theme: saved });
    this.applyThemeClass(saved);

    const compact = this.readPersistedCompactMode();
    this.patchState({ compactMode: compact });
    this.applyCompactClass(compact);
  }

  toggleTheme(): void {
    const next: AppTheme = this.state.value.theme === 'DARK' ? 'LIGHT' : 'DARK';
    this.setTheme(next);
  }

  setTheme(theme: AppTheme): void {
    if (this.state.value.theme === theme) return;
    this.patchState({ theme });
    this.persistTheme(theme);
    this.applyThemeClass(theme);
    const payload: ThemeUpdatedPayload = {
      action: 'theme_updated',
      entity: 'app_theme',
      status: theme,
    };
    this.events.emit(AppEventType.SETTINGS_UPDATED, payload);
  }

  toggleCompactMode(): void {
    const next: CompactModePreference = this.state.value.compactMode === 'ON' ? 'OFF' : 'ON';
    this.setCompactMode(next);
  }

  setCompactMode(mode: CompactModePreference): void {
    if (this.state.value.compactMode === mode) return;
    this.patchState({ compactMode: mode });
    this.persistCompactMode(mode);
    this.applyCompactClass(mode);
    this.events.emit(AppEventType.SETTINGS_UPDATED, {
      action: 'compact_mode_updated',
      entity: 'compact_mode',
      status: mode,
    });
  }

  selectSettingsForUser(userId: number): Observable<UserSettings | undefined> {
    return this.state$.pipe(map(s => s.byUserId[userId]));
  }

  selectLoading(): Observable<boolean> {
    return this.state$.pipe(map(s => s.loading));
  }

  selectError(): Observable<string | null> {
    return this.state$.pipe(map(s => s.error));
  }

  selectActiveUserId(): Observable<number | null> {
    return this.state$.pipe(map(s => s.activeUserId));
  }

  getUserSettings(userId: number): void {
    this.patchState({ loading: true, error: null, activeUserId: userId });
    this.api.getUserSettings(userId).pipe(
      tap(settings => {
        const cur = this.state.value;
        this.patchState({
          byUserId: { ...cur.byUserId, [userId]: settings },
          loading: false,
        });
      }),
      catchError((err: { message: string }) => {
        this.patchState({ loading: false, error: err.message });
        return of(null);
      })
    ).subscribe();
  }

  updateUserTheme(userId: number, theme: ThemePreference): void {
    const current = this.state.value.byUserId[userId];
    if (!current) {
      this.getUserSettings(userId);
      return;
    }
    const next: UserSettings = { ...current, theme };
    this.persist(next);
  }

  updatePrimaryColor(userId: number, primaryColor: string): void {
    const current = this.state.value.byUserId[userId];
    if (!current) {
      this.getUserSettings(userId);
      return;
    }
    const next: UserSettings = { ...current, primaryColor };
    this.persist(next);
    // Live UI update (global contract). This is safe even if backend save fails.
    this.doc.documentElement.style.setProperty('--clr-primary', primaryColor);
  }

  updateFontSize(userId: number, fontSize: UserSettings['fontSize']): void {
    const current = this.state.value.byUserId[userId];
    if (!current) {
      this.getUserSettings(userId);
      return;
    }
    const next: UserSettings = { ...current, fontSize };
    this.persist(next);
    this.applyFontSizeClass(fontSize);
  }

  updatePreferences(userId: number, notifications: Partial<UserNotificationPreferences>): void {
    const current = this.state.value.byUserId[userId];
    if (!current) {
      this.getUserSettings(userId);
      return;
    }
    const next: UserSettings = {
      ...current,
      notifications: { ...current.notifications, ...notifications },
    };
    this.persist(next);
  }

  private persist(settings: UserSettings): void {
    this.patchState({ loading: true, error: null });
    this.api.updateUserSettings(settings).pipe(
      tap(saved => {
        const cur = this.state.value;
        this.patchState({
          byUserId: { ...cur.byUserId, [saved.userId]: saved },
          loading: false,
        });
        const payload: SettingsUpdatedPayload = {
          userId: saved.userId,
          action: 'settings_updated',
          entity: 'user_settings',
          entityId: saved.userId,
          status: 'ok',
        };
        this.events.emit(AppEventType.SETTINGS_UPDATED, payload);
      }),
      catchError((err: { message: string }) => {
        this.patchState({ loading: false, error: err.message });
        return of(null);
      })
    ).subscribe();
  }

  private patchState(partial: Partial<SettingsState>): void {
    this.state.next({ ...this.state.value, ...partial });
  }

  private readPersistedTheme(): AppTheme {
    try {
      const raw = globalThis?.localStorage?.getItem(this.themeStorageKey);
      return raw === 'DARK' || raw === 'LIGHT' ? raw : 'LIGHT';
    } catch {
      return 'LIGHT';
    }
  }

  private persistTheme(theme: AppTheme): void {
    try {
      globalThis?.localStorage?.setItem(this.themeStorageKey, theme);
    } catch {
      // ignore storage errors (private mode / policy)
    }
  }

  private applyThemeClass(theme: AppTheme): void {
    const el = this.doc.documentElement;
    // Apply on <html>; CSS vars can target .theme-dark/.theme-light.
    el.classList.toggle('theme-dark', theme === 'DARK');
    el.classList.toggle('theme-light', theme === 'LIGHT');
  }

  private readPersistedCompactMode(): CompactModePreference {
    try {
      const raw = globalThis?.localStorage?.getItem(this.compactStorageKey);
      return raw === 'ON' || raw === 'OFF' ? raw : 'OFF';
    } catch {
      return 'OFF';
    }
  }

  private persistCompactMode(mode: CompactModePreference): void {
    try {
      globalThis?.localStorage?.setItem(this.compactStorageKey, mode);
    } catch {
      // ignore
    }
  }

  private applyCompactClass(mode: CompactModePreference): void {
    this.doc.documentElement.classList.toggle('mode-compact', mode === 'ON');
  }

  private applyFontSizeClass(fontSize: UserSettings['fontSize']): void {
    const el = this.doc.documentElement;
    el.classList.toggle('font-sm', fontSize === 'SMALL');
    el.classList.toggle('font-md', fontSize === 'MEDIUM');
    el.classList.toggle('font-lg', fontSize === 'LARGE');
  }
}
