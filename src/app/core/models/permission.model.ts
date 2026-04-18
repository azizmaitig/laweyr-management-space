import type { UserRole } from './platform.model';

export type PermissionResource = 'CASE' | 'DOCUMENT' | 'TASK' | 'FINANCE' | 'USER';
export type PermissionAction = 'READ' | 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'UPLOAD';
export type PermissionScope = 'OWN' | 'ASSIGNED' | 'ALL';

export interface Permission {
  resource: PermissionResource;
  action: PermissionAction;
  scope: PermissionScope;
}

export interface PermissionOverride extends Permission {
  mode: 'ADD' | 'REMOVE';
}

export type RoleDefaultPermissions = Record<UserRole, readonly Permission[]>;

export interface EntityAccessContext {
  ownerId?: number;
  assignedUserIds?: number[];
}

export interface PermissionKey {
  resource: PermissionResource;
  action: PermissionAction;
}
