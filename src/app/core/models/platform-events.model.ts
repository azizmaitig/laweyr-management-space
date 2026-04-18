import type { BackupStatus, UserRole } from './platform.model';
import type { PermissionOverride } from './permission.model';

/**
 * Standard platform orchestration payload — extend per event as needed.
 */
export interface PlatformOrchestrationPayload {
  userId?: number;
  action?: string;
  entity?: string;
  entityId?: number;
  status?: BackupStatus | string;
  message?: string;
}

export interface UserCreatedPayload extends PlatformOrchestrationPayload {
  userId: number;
  action: 'user_created';
  entity: 'user';
  entityId: number;
}

export interface UserSelectedPayload extends PlatformOrchestrationPayload {
  userId: number;
  action: 'user_selected';
  entity: 'user';
  entityId: number;
  status: 'ok';
}

export interface UserUpdatedPayload extends PlatformOrchestrationPayload {
  userId: number;
  action: 'user_updated';
  entity: 'user';
  entityId: number;
}

export interface UserRoleChangedPayload extends PlatformOrchestrationPayload {
  userId: number;
  action: 'user_role_changed';
  entity: 'user';
  entityId: number;
  status: UserRole;
}

export interface PermissionsUpdatedPayload extends PlatformOrchestrationPayload {
  userId: number;
  action: 'permissions_updated';
  entity: 'user_permissions';
  entityId: number;
  status: 'ok';
  overridesCount: number;
  overrides?: PermissionOverride[];
}

export interface ActivityLoggedPayload extends PlatformOrchestrationPayload {
  userId: number;
  action: string;
  entity: string;
  entityId: number;
  status: 'recorded';
}

export interface BackupLifecyclePayload extends PlatformOrchestrationPayload {
  userId?: number;
  action: 'backup_started' | 'backup_success' | 'backup_failed';
  entity: 'backup';
  entityId?: number;
  status: BackupStatus | 'IN_PROGRESS';
  location?: string;
}

export interface SettingsUpdatedPayload extends PlatformOrchestrationPayload {
  userId: number;
  action: 'settings_updated';
  entity: 'user_settings';
  entityId: number;
  status: 'ok';
}

/**
 * App-level theme updated (local setting).
 * Emitted on {@link AppEventType.SETTINGS_UPDATED} for orchestration listeners.
 */
export interface ThemeUpdatedPayload extends PlatformOrchestrationPayload {
  action: 'theme_updated';
  entity: 'app_theme';
  status: 'LIGHT' | 'DARK';
}
