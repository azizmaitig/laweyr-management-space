import type { PermissionOverride } from './permission.model';

export type UserRole = 'LAWYER' | 'SECRETARY' | 'CLIENT' | 'PARTNER';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  permissionsOverride?: PermissionOverride[];
  createdAt: Date;
}

export interface ActivityLog {
  id: number;
  userId: number;
  action: string;
  entity: string;
  entityId: number;
  timestamp: Date;
}

export type BackupStatus = 'SUCCESS' | 'FAILED';

export interface Backup {
  id: number;
  createdAt: Date;
  status: BackupStatus;
  location: string;
  /** AES-256 (or backend-equivalent) encryption flag */
  encrypted: boolean;
}

export type ThemePreference = 'LIGHT' | 'DARK';
export type FontSizePreference = 'SMALL' | 'MEDIUM' | 'LARGE';

export interface UserNotificationPreferences {
  email: boolean;
  inApp: boolean;
  deadlines: boolean;
}

export interface UserSettings {
  userId: number;
  theme: ThemePreference;
  primaryColor: string;
  fontSize: FontSizePreference;
  notifications: UserNotificationPreferences;
}
