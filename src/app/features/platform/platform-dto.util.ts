import type { ActivityLog, Backup, User } from '../../core/models';

/** API wire format (ISO dates). */
export type UserDto = Omit<User, 'createdAt'> & { createdAt: string };
export type ActivityLogDto = Omit<ActivityLog, 'timestamp'> & { timestamp: string };
export type BackupDto = Omit<Backup, 'createdAt'> & { createdAt: string };

export function userFromDto(dto: UserDto): User {
  return {
    ...dto,
    createdAt: new Date(dto.createdAt),
  };
}

export function activityFromDto(dto: ActivityLogDto): ActivityLog {
  return {
    ...dto,
    timestamp: new Date(dto.timestamp),
  };
}

export function backupFromDto(dto: BackupDto): Backup {
  return {
    ...dto,
    createdAt: new Date(dto.createdAt),
  };
}
