import type { User, UserRole } from '../../core/models';

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  LAWYER: 'محامي',
  SECRETARY: 'كاتب',
  CLIENT: 'حريف',
  PARTNER: 'شريك / خبير',
};

export const USER_ROLE_FILTER_TABS: ReadonlyArray<{ key: UserRole | 'ALL'; label: string }> = [
  { key: 'ALL', label: 'All' },
  { key: 'LAWYER', label: 'Lawyers' },
  { key: 'SECRETARY', label: 'Secretaries' },
  { key: 'CLIENT', label: 'Clients' },
  { key: 'PARTNER', label: 'Partners' },
];

export function getUserRoleLabel(role: UserRole): string {
  return USER_ROLE_LABELS[role];
}

export function filterUsersByRoles(users: User[], selectedRoles: UserRole[]): User[] {
  if (selectedRoles.length === 0) return users;
  const allowed = new Set(selectedRoles);
  return users.filter(user => allowed.has(user.role));
}
