import { DEFAULT_ACCESS_BY_KIND } from '../models/lawyer-subaccount.model';
import type { LawyerSubAccount } from '../models/lawyer-subaccount.model';

/** Seed data for dev interceptor — matches previous in-memory defaults. */
export const LAWYER_SUB_ACCOUNTS_DEMO_SEED: LawyerSubAccount[] = [
  {
    id: 1,
    name: 'Sonia Ben Ammar',
    email: 'sonia.benammar@cabinet-demo.tn',
    kind: 'SECRETARY',
    access: [...DEFAULT_ACCESS_BY_KIND.SECRETARY],
    createdAt: new Date().toISOString(),
    active: true,
    status: 'ACTIVE',
  },
  {
    id: 2,
    name: 'Client — مؤسسة النور',
    email: 'contact@nour-demo.tn',
    kind: 'CLIENT',
    access: [...DEFAULT_ACCESS_BY_KIND.CLIENT],
    createdAt: new Date().toISOString(),
    active: true,
    status: 'ACTIVE',
  },
  {
    id: 3,
    name: 'Maître Salah Mezzi',
    email: 'salah.mezzi@cabinet-demo.tn',
    kind: 'PARTNER',
    access: [...DEFAULT_ACCESS_BY_KIND.PARTNER],
    createdAt: new Date().toISOString(),
    active: false,
    status: 'ACTIVE',
  },
];
