import type { Case } from '../../core/models';
import type { User, UserRole } from '../../core/models';

export type PlatformPermission =
  | 'cases:read:assigned'
  | 'cases:manage:assigned'
  | 'tasks:read:assigned'
  | 'tasks:write:assigned'
  | 'documents:read:assigned'
  | 'documents:write:assigned'
  | 'cases:read:own'
  | 'documents:upload:own'
  | 'cases:read:multi';

export interface CaseAccessContext {
  assignedCaseIds?: number[];
  ownCaseId?: number;
  partnerCaseIds?: number[];
}

const ROLE_PERMISSIONS: Record<UserRole, readonly PlatformPermission[]> = {
  LAWYER: ['cases:read:assigned', 'cases:manage:assigned', 'tasks:read:assigned', 'tasks:write:assigned', 'documents:read:assigned', 'documents:write:assigned'],
  SECRETARY: ['tasks:read:assigned', 'tasks:write:assigned', 'documents:read:assigned', 'documents:write:assigned'],
  CLIENT: ['cases:read:own', 'documents:upload:own'],
  PARTNER: ['cases:read:multi'],
};

export function getPermissionsByRole(role: UserRole): readonly PlatformPermission[] {
  return ROLE_PERMISSIONS[role];
}

export function roleHasPermission(role: UserRole, permission: PlatformPermission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Whether the user may open a case based on role + case context.
 */
export function userMayAccessCase(
  user: User | null,
  caseId: number,
  options: CaseAccessContext = {},
): boolean {
  if (!user) return false;
  const assigned = new Set(options.assignedCaseIds ?? []);
  const partnerCases = new Set(options.partnerCaseIds ?? []);

  switch (user.role) {
    case 'LAWYER':
      return assigned.has(caseId);
    case 'SECRETARY':
      return assigned.has(caseId);
    case 'CLIENT':
      return options.ownCaseId === caseId;
    case 'PARTNER':
      return partnerCases.has(caseId);
    default:
      return false;
  }
}

/**
 * Filter case lists for workspace visibility.
 */
export function filterCasesForUser(cases: Case[], user: User | null, options: CaseAccessContext = {}): Case[] {
  if (!user) return [];
  return cases.filter(c => userMayAccessCase(user, c.id, options));
}
