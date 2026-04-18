import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { map, take } from 'rxjs/operators';
import type { EntityAccessContext, PermissionAction, PermissionResource } from '../models';
import { PermissionService } from '../services/permission.service';
import { UsersStateService } from '../../features/platform/services/users-state.service';

export function permissionGuard(
  resource: PermissionResource,
  action: PermissionAction,
  contextResolver?: () => EntityAccessContext,
): CanActivateFn {
  return () => {
    const permissions = inject(PermissionService);
    const usersState = inject(UsersStateService);
    const router = inject(Router);
    const context = contextResolver?.() ?? {};

    return usersState.currentUser$.pipe(
      take(1),
      map(user => {
        const allowed = permissions.hasPermission(user, resource, action, context);
        if (!allowed) {
          router.navigate(['/espace-avocat/dashboard']);
        }
        return allowed;
      }),
    );
  };
}
