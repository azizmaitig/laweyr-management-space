import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { User, UserRole } from '../../../core/models';
import { USER_ROLE_LABELS } from '../../../features/platform/user-role.util';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersListComponent {
  @Input() users: User[] = [];
  @Input() selectedUserId: number | null = null;
  @Output() userSelected = new EventEmitter<number>();

  searchTerm = '';
  selectedRole: UserRole | 'ALL' = 'ALL';

  readonly roleFilters: Array<UserRole | 'ALL'> = ['ALL', 'LAWYER', 'SECRETARY', 'CLIENT', 'PARTNER'];

  get filteredUsers(): User[] {
    const search = this.searchTerm.trim().toLowerCase();
    return this.users.filter(user => {
      const matchRole = this.selectedRole === 'ALL' || user.role === this.selectedRole;
      if (!matchRole) return false;
      if (!search) return true;
      return user.name.toLowerCase().includes(search) || user.email.toLowerCase().includes(search);
    });
  }

  roleLabel(role: UserRole): string {
    return USER_ROLE_LABELS[role];
  }

  roleClass(role: UserRole): string {
    return `badge--${role.toLowerCase()}`;
  }

  initials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .map(part => part[0]?.toUpperCase() ?? '')
      .join('')
      .slice(0, 2);
  }

  isActive(user: User): boolean {
    const maybeWithStatus = user as User & { active?: boolean };
    return maybeWithStatus.active ?? true;
  }
}
