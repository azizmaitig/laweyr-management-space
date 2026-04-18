import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { User, UserRole } from '../../../core/models';
import { USER_ROLE_LABELS } from '../../../features/platform/user-role.util';

@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDetailsComponent {
  @Input() user: User | null = null;
  @Output() roleChanged = new EventEmitter<UserRole>();

  readonly roles: UserRole[] = ['LAWYER', 'SECRETARY', 'CLIENT', 'PARTNER'];

  roleLabel(role: UserRole): string {
    return USER_ROLE_LABELS[role];
  }
}
