import { Injectable } from '@angular/core';
import { ActivityStateService } from './services/activity-state.service';
import { BackupStateService } from './services/backup-state.service';
import { SettingsStateService } from './services/settings-state.service';
import { UsersStateService } from './services/users-state.service';

/**
 * Eagerly constructs platform state services (event listeners, backup schedule)
 * so orchestration runs without a dedicated platform UI route.
 */
@Injectable({ providedIn: 'root' })
export class PlatformFeatureInitService {
  constructor(
    _users: UsersStateService,
    _activity: ActivityStateService,
    backups: BackupStateService,
    _settings: SettingsStateService,
  ) {
    backups.startDailyAutomaticBackups();
  }
}
