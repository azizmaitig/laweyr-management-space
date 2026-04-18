import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { SettingsStateService, type AppTheme } from '../../features/platform/services/settings-state.service';
import type { FontSizePreference, UserSettings } from '../../core/models';
import { PlatformSessionService } from '../../features/platform/services/platform-session.service';

import { SettingsSidebarComponent, type SettingsCategory } from './ui/settings-sidebar.component';
import { SettingsCardComponent } from './ui/settings-card.component';
import { ThemeSelectorComponent, type ThemeCard } from './ui/theme-selector.component';
import { ToggleSwitchComponent } from './ui/toggle-switch.component';
import { ColorPickerComponent, type ColorSwatch } from './ui/color-picker.component';
import { SubAccountsSettingsComponent } from '../ea-settings/sub-accounts-settings.component';

type CategoryId = SettingsCategory['id'];

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SettingsSidebarComponent,
    SettingsCardComponent,
    ThemeSelectorComponent,
    ToggleSwitchComponent,
    ColorPickerComponent,
    SubAccountsSettingsComponent,
  ],
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPageComponent {
  private destroyRef = inject(DestroyRef);
  private settings = inject(SettingsStateService);
  private platformSession = inject(PlatformSessionService);

  readonly selected = signal<CategoryId>('appearance');

  readonly categories: SettingsCategory[] = [
    { id: 'appearance', label: 'Appearance', desc: 'Theme, colors, typography', icon: '🎨' },
    { id: 'notifications', label: 'Notifications', desc: 'Email and in‑app alerts', icon: '🔔' },
    { id: 'preferences', label: 'Preferences', desc: 'Compact mode and defaults', icon: '⚙️' },
    { id: 'team', label: 'Team & Access', desc: 'Users, roles, permissions', icon: '👥' },
    { id: 'system', label: 'System', desc: 'Backups and status', icon: '🛡️' },
  ];

  readonly themeConfig$ = of<ThemeCard[]>([
    { id: 'LIGHT', title: 'Light', subtitle: 'Clean & bright', preview: 'light', enabled: true },
    { id: 'DARK', title: 'Dark', subtitle: 'Night‑friendly', preview: 'dark', enabled: true },
    { id: 'BLUE', title: 'Blue', subtitle: 'Premium (soon)', preview: 'blue', enabled: false },
    { id: 'GRAPHITE', title: 'Graphite', subtitle: 'Premium (soon)', preview: 'graphite', enabled: false },
  ]);

  readonly theme$ = this.settings.theme$;
  readonly compactMode$ = this.settings.compactMode$;

  readonly activeUserId = signal<number>(1);
  readonly userSettings = signal<UserSettings | undefined>(undefined);
  readonly appTheme = signal<AppTheme>('LIGHT');

  readonly isDark = computed(() => this.appTheme() === 'DARK');
  readonly primaryColor = computed(() => this.userSettings()?.primaryColor ?? '#ea3f48');
  readonly fontSize = computed<FontSizePreference>(() => this.userSettings()?.fontSize ?? 'MEDIUM');

  readonly colorSwatches: ColorSwatch[] = [
    { id: 'brand', color: '#ea3f48' },
    { id: 'blue', color: '#3b82f6' },
    { id: 'teal', color: '#0d9488' },
    { id: 'violet', color: '#8b5cf6' },
    { id: 'amber', color: '#f59e0b' },
    { id: 'green', color: '#16a34a' },
  ];

  constructor() {
    // Ensure there is an active user for settings (demo default: 1).
    this.settings.getUserSettings(1);

    this.settings.state$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(s => {
        const uid = s.activeUserId ?? 1;
        this.activeUserId.set(uid);
        this.userSettings.set(s.byUserId[uid]);
      });

    this.theme$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(t => this.appTheme.set(t));

    // Keep platform session aligned (if used by other features).
    this.platformSession.setActorUserId(1);
  }

  selectCategory(id: CategoryId): void {
    this.selected.set(id);
  }

  selectTheme(theme: ThemeCard['id']): void {
    if (theme === 'LIGHT' || theme === 'DARK') {
      this.settings.setTheme(theme);
      this.settings.updateUserTheme(this.activeUserId(), theme);
    }
  }

  toggleDarkMode(): void {
    this.settings.toggleTheme();
    this.settings.updateUserTheme(this.activeUserId(), this.settingsThemeToUserTheme());
  }

  private settingsThemeToUserTheme(): 'LIGHT' | 'DARK' {
    return this.appTheme() === 'DARK' ? 'DARK' : 'LIGHT';
  }

  setPrimaryColor(color: string): void {
    this.settings.updatePrimaryColor(this.activeUserId(), color);
  }

  setFontSize(size: FontSizePreference): void {
    this.settings.updateFontSize(this.activeUserId(), size);
  }

  toggleCompact(on: boolean): void {
    this.settings.setCompactMode(on ? 'ON' : 'OFF');
  }

  setNotification(key: keyof UserSettings['notifications'], on: boolean): void {
    this.settings.updatePreferences(this.activeUserId(), { [key]: on });
  }

  // System (example bindings)
  backupStatus = signal<'SUCCESS' | 'FAILED' | 'IDLE'>('IDLE');
  lastBackup = signal<Date | null>(null);

  runBackupNow(): void {
    this.backupStatus.set('SUCCESS');
    this.lastBackup.set(new Date());
  }
}

