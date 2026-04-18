import { Injectable } from '@angular/core';
import type { Case, User } from '../models';
import type {
  EntityAccessContext,
  Permission,
  PermissionAction,
  PermissionOverride,
  PermissionResource,
} from '../models';
import { ROLE_DEFAULT_PERMISSIONS } from '../../features/platform/permissions/role-default-permissions.config';

const toKey = (permission: Pick<Permission, 'resource' | 'action' | 'scope'>): string =>
  `${permission.resource}:${permission.action}:${permission.scope}`;

@Injectable({ providedIn: 'root' })
export class PermissionService {
  resolvePermissions(user: User | null): Permission[] {
    if (!user) return [];
    const base = ROLE_DEFAULT_PERMISSIONS[user.role] ?? [];
    return this.applyOverrides(base, user.permissionsOverride ?? []);
  }

  hasPermission(
    user: User | null,
    resource: PermissionResource,
    action: PermissionAction,
    context: EntityAccessContext = {},
  ): boolean {
    const permissions = this.resolvePermissions(user);
    if (!permissions.length || !user) return false;
    return permissions.some(p => p.resource === resource && p.action === action && this.matchesScope(user, p.scope, context));
  }

  canReadCase(user: User | null, _case: Pick<Case, 'id'>, context: EntityAccessContext = {}): boolean {
    return this.hasPermission(user, 'CASE', 'READ', context);
  }

  canEditDocument(
    user: User | null,
    document: { ownerId?: number; assignedUserIds?: number[] } = {},
  ): boolean {
    return this.hasPermission(user, 'DOCUMENT', 'UPDATE', document);
  }

  canViewFinance(user: User | null, caseContext: EntityAccessContext = {}): boolean {
    return this.hasPermission(user, 'FINANCE', 'READ', caseContext);
  }

  private applyOverrides(base: readonly Permission[], overrides: readonly PermissionOverride[]): Permission[] {
    const map = new Map<string, Permission>();
    base.forEach(permission => map.set(toKey(permission), permission));
    overrides.forEach(override => {
      const key = toKey(override);
      if (override.mode === 'ADD') {
        map.set(key, { resource: override.resource, action: override.action, scope: override.scope });
      } else {
        map.delete(key);
      }
    });
    return [...map.values()];
  }

  private matchesScope(user: User, scope: Permission['scope'], context: EntityAccessContext): boolean {
    if (scope === 'ALL') return true;
    if (scope === 'OWN') return context.ownerId === user.id;
    const assigned = context.assignedUserIds ?? [];
    return assigned.includes(user.id);
  }
}
