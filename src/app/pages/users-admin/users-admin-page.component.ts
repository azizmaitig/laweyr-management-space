import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { Permission, PermissionOverride, User, UserRole } from '../../core/models';
import { AppEventType } from '../../core/models/events.model';
import type {
  PermissionsUpdatedPayload,
  UserRoleChangedPayload,
  UserSelectedPayload,
} from '../../core/models/platform-events.model';
import { EventService } from '../../core/services/event.service';
import { UsersStateService } from '../../features/platform/services/users-state.service';
import { ROLE_DEFAULT_PERMISSIONS } from '../../features/platform/permissions/role-default-permissions.config';
import { UsersListComponent } from './ui/users-list.component';
import { UserDetailsComponent } from './ui/user-details.component';
import { PermissionsMatrixComponent } from './ui/permissions-matrix.component';

@Component({
  selector: 'app-users-admin-page',
  standalone: true,
  imports: [CommonModule, UsersListComponent, UserDetailsComponent, PermissionsMatrixComponent],
  templateUrl: './users-admin-page.component.html',
  styleUrl: './users-admin-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersAdminPageComponent {
  private usersState = inject(UsersStateService);
  private events = inject(EventService);
  private destroyRef = inject(DestroyRef);

  readonly users = signal<User[]>([]);
  readonly selectedUserId = signal<number | null>(null);
  readonly currentUser$ = this.usersState.currentUser$;

  readonly selectedUser = computed(() => {
    const id = this.selectedUserId();
    if (id == null) return null;
    return this.users().find(user => user.id === id) ?? null;
  });

  constructor() {
    this.usersState.loadUsers();

    this.usersState.users$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(users => {
        this.users.set(users);
        if (users.length && this.selectedUserId() == null) {
          this.selectUser(users[0].id);
        }
      });

    this.events
      .on<UserRoleChangedPayload>(AppEventType.USER_ROLE_CHANGED)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(payload => {
        if (this.selectedUserId() === payload.userId) {
          this.selectedUserId.set(payload.userId);
        }
      });

    this.events
      .on<PermissionsUpdatedPayload>(AppEventType.PERMISSIONS_UPDATED)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(payload => {
        if (this.selectedUserId() === payload.userId) {
          this.selectedUserId.set(payload.userId);
        }
      });
  }

  selectUser(userId: number): void {
    this.selectedUserId.set(userId);
    const payload: UserSelectedPayload = {
      userId,
      action: 'user_selected',
      entity: 'user',
      entityId: userId,
      status: 'ok',
    };
    this.events.emit(AppEventType.USER_SELECTED, payload);
  }

  changeRole(role: UserRole): void {
    const user = this.selectedUser();
    if (!user || user.role === role) return;
    this.usersState.updateUserRole(user.id, role);
  }

  savePermissions(desiredPermissions: Permission[]): void {
    const user = this.selectedUser();
    if (!user) return;
    const overrides = this.computeOverrides(user.role, desiredPermissions);
    this.usersState.updatePermissionsOverride(user.id, overrides);
  }

  private computeOverrides(role: UserRole, desiredPermissions: Permission[]): PermissionOverride[] {
    const defaults = ROLE_DEFAULT_PERMISSIONS[role];
    const desired = new Set(desiredPermissions.map(this.toKey));
    const base = new Set(defaults.map(this.toKey));

    const addOverrides: PermissionOverride[] = desiredPermissions
      .filter(permission => !base.has(this.toKey(permission)))
      .map(permission => ({ ...permission, mode: 'ADD' as const }));

    const removeOverrides: PermissionOverride[] = defaults
      .filter(permission => !desired.has(this.toKey(permission)))
      .map(permission => ({ ...permission, mode: 'REMOVE' as const }));

    return [...addOverrides, ...removeOverrides];
  }

  private toKey(permission: Pick<Permission, 'resource' | 'action' | 'scope'>): string {
    return `${permission.resource}:${permission.action}:${permission.scope}`;
  }
}
