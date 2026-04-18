import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Permission, PermissionAction, PermissionResource, PermissionScope, User } from '../../../core/models';
import { PermissionService } from '../../../core/services/permission.service';

interface CellState {
  enabled: boolean;
  scope: PermissionScope;
}

@Component({
  selector: 'app-permissions-matrix',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './permissions-matrix.component.html',
  styleUrl: './permissions-matrix.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermissionsMatrixComponent {
  private permissionService = inject(PermissionService);

  @Input() set user(value: User | null) {
    this._user = value;
    this.resetMatrixFromUser();
  }
  get user(): User | null {
    return this._user;
  }
  private _user: User | null = null;

  @Output() saveRequested = new EventEmitter<Permission[]>();

  readonly resources: PermissionResource[] = ['CASE', 'DOCUMENT', 'TASK', 'FINANCE', 'USER'];
  readonly actions: PermissionAction[] = ['READ', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT'];
  readonly scopes: PermissionScope[] = ['OWN', 'ASSIGNED', 'ALL'];

  private matrix = new Map<string, CellState>();

  isOn(resource: PermissionResource, action: PermissionAction): boolean {
    return this.matrix.get(this.key(resource, action))?.enabled ?? false;
  }

  scopeFor(resource: PermissionResource, action: PermissionAction): PermissionScope {
    return this.matrix.get(this.key(resource, action))?.scope ?? 'OWN';
  }

  toggle(resource: PermissionResource, action: PermissionAction): void {
    const key = this.key(resource, action);
    const cell = this.matrix.get(key) ?? { enabled: false, scope: 'OWN' as PermissionScope };
    this.matrix.set(key, { ...cell, enabled: !cell.enabled });
  }

  setScope(resource: PermissionResource, action: PermissionAction, scope: PermissionScope): void {
    const key = this.key(resource, action);
    const cell = this.matrix.get(key) ?? { enabled: true, scope };
    this.matrix.set(key, { ...cell, scope });
  }

  save(): void {
    this.saveRequested.emit(this.flattenMatrix());
  }

  private resetMatrixFromUser(): void {
    this.matrix.clear();
    if (!this._user) return;
    const effective = this.permissionService.resolvePermissions(this._user);
    for (const resource of this.resources) {
      for (const action of this.actions) {
        const candidates = effective.filter(p => p.resource === resource && p.action === action);
        if (!candidates.length) {
          this.matrix.set(this.key(resource, action), { enabled: false, scope: 'OWN' });
          continue;
        }
        const winner = this.pickHighestScope(candidates);
        this.matrix.set(this.key(resource, action), { enabled: true, scope: winner.scope });
      }
    }
  }

  private flattenMatrix(): Permission[] {
    const out: Permission[] = [];
    for (const resource of this.resources) {
      for (const action of this.actions) {
        const state = this.matrix.get(this.key(resource, action));
        if (!state?.enabled) continue;
        out.push({ resource, action, scope: state.scope });
      }
    }
    return out;
  }

  private pickHighestScope(perms: Permission[]): Permission {
    const rank: Record<PermissionScope, number> = { OWN: 1, ASSIGNED: 2, ALL: 3 };
    return perms.reduce((best, current) => (rank[current.scope] > rank[best.scope] ? current : best));
  }

  private key(resource: PermissionResource, action: PermissionAction): string {
    return `${resource}:${action}`;
  }
}
