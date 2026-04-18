import type { Permission, RoleDefaultPermissions } from '../../../core/models';

const CASE_ACTIONS_ALL: Permission['action'][] = ['READ', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT'];
const DOCUMENT_ACTIONS_ALL: Permission['action'][] = ['READ', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'UPLOAD'];
const TASK_ACTIONS_ALL: Permission['action'][] = ['READ', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT'];

const mapActions = (
  resource: Permission['resource'],
  scope: Permission['scope'],
  actions: Permission['action'][],
): Permission[] => actions.map(action => ({ resource, action, scope }));

export const ROLE_DEFAULT_PERMISSIONS: RoleDefaultPermissions = {
  LAWYER: [
    ...mapActions('CASE', 'ASSIGNED', CASE_ACTIONS_ALL),
    ...mapActions('DOCUMENT', 'ASSIGNED', DOCUMENT_ACTIONS_ALL),
    ...mapActions('TASK', 'ASSIGNED', TASK_ACTIONS_ALL),
    ...mapActions('FINANCE', 'ASSIGNED', ['READ', 'CREATE']),
  ],
  SECRETARY: [
    ...mapActions('CASE', 'ASSIGNED', ['READ']),
    ...mapActions('DOCUMENT', 'ASSIGNED', ['CREATE', 'READ']),
    ...mapActions('TASK', 'ASSIGNED', ['CREATE', 'UPDATE']),
  ],
  CLIENT: [
    ...mapActions('CASE', 'OWN', ['READ']),
    ...mapActions('DOCUMENT', 'OWN', ['READ', 'UPLOAD']),
  ],
  PARTNER: [
    ...mapActions('CASE', 'ALL', ['READ']),
    ...mapActions('DOCUMENT', 'ALL', ['READ']),
    ...mapActions('FINANCE', 'ALL', ['READ']),
  ],
};
