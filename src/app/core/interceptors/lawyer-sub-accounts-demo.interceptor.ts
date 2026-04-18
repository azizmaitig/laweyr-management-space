import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { LawyerSubAccount } from '../models/lawyer-subaccount.model';
import { normalizeSubAccountAccess } from '../models/lawyer-subaccount.model';
import { LAWYER_SUB_ACCOUNTS_DEMO_SEED } from './lawyer-sub-accounts-demo.data';

let demoSubAccounts: LawyerSubAccount[] = JSON.parse(JSON.stringify(LAWYER_SUB_ACCOUNTS_DEMO_SEED));
let nextSubAccountId = 4;

function apiPath(url: string): string | null {
  const base = environment.apiUrl.replace(/\/$/, '');
  if (!url.startsWith(base)) return null;
  return url.slice(base.length).split('?')[0];
}

function makeInviteToken(): string {
  return `inv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * When `environment.lawyerSubAccountsDemo` is true, mocks
 * sub-accounts + invite accept + send-invite for local dev without Spring Boot.
 */
export const lawyerSubAccountsDemoInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.lawyerSubAccountsDemo || environment.production) {
    return next(req);
  }

  const path = apiPath(req.url);
  if (path == null) return next(req);

  const json = (body: unknown, status = 200) => of(new HttpResponse({ body, status, url: req.url }));

  if (path === '/invites/accept' && req.method === 'POST') {
    const body = req.body as { token?: string };
    const token = body?.token?.trim();
    if (!token) return json({ message: 'token required' }, 400);
    const idx = demoSubAccounts.findIndex(a => a.inviteToken === token && a.status === 'PENDING');
    if (idx < 0) return json({ message: 'Invalid or expired invite' }, 404);
    const prev = demoSubAccounts[idx];
    const updated: LawyerSubAccount = {
      ...prev,
      status: 'ACTIVE',
      inviteToken: undefined,
    };
    demoSubAccounts = demoSubAccounts.map(a => (a.id === prev.id ? updated : a));
    return json({ subAccountId: prev.id });
  }

  const basePath = '/lawyers/me/sub-accounts';
  if (path === basePath && req.method === 'GET') {
    return json([...demoSubAccounts]);
  }
  if (path === basePath && req.method === 'POST') {
    const body = req.body as Partial<LawyerSubAccount>;
    const inviteToken = makeInviteToken();
    const created: LawyerSubAccount = {
      id: nextSubAccountId++,
      name: String(body.name ?? '').trim(),
      email: String(body.email ?? '').trim(),
      phone: body.phone ? String(body.phone).trim() : undefined,
      kind: body.kind!,
      access: normalizeSubAccountAccess([...(body.access ?? [])]),
      caseScope: body.caseScope ?? 'ALL',
      allowedCaseIds: body.caseScope === 'SELECTED' ? [...(body.allowedCaseIds ?? [])] : undefined,
      createdAt: new Date().toISOString(),
      active: body.active !== false,
      status: 'PENDING',
      inviteToken,
    };
    demoSubAccounts = [...demoSubAccounts, created];
    return json(created, 201);
  }

  const sendInvite = /^\/lawyers\/me\/sub-accounts\/(\d+)\/send-invite$/.exec(path);
  if (sendInvite && req.method === 'POST') {
    const id = Number(sendInvite[1]);
    const exists = demoSubAccounts.some(a => a.id === id);
    if (!exists) return json({ message: 'Sub-account not found' }, 404);
    return json({ sent: true }, 202);
  }

  const byId = /^\/lawyers\/me\/sub-accounts\/(\d+)$/.exec(path);
  if (byId && req.method === 'PATCH') {
    const id = Number(byId[1]);
    const body = req.body as Partial<LawyerSubAccount>;
    const idx = demoSubAccounts.findIndex(a => a.id === id);
    if (idx < 0) return json({ message: 'Sub-account not found' }, 404);
    const prev = demoSubAccounts[idx];
    const access = body.access != null ? normalizeSubAccountAccess(body.access) : prev.access;
    const caseScope = body.caseScope !== undefined ? body.caseScope : (prev.caseScope ?? 'ALL');
    const allowedCaseIds =
      caseScope === 'SELECTED'
        ? [...(body.allowedCaseIds !== undefined ? body.allowedCaseIds : (prev.allowedCaseIds ?? []))]
        : undefined;
    const merged: LawyerSubAccount = {
      ...prev,
      name: body.name !== undefined ? body.name : prev.name,
      email: body.email !== undefined ? body.email : prev.email,
      phone: body.phone !== undefined ? body.phone : prev.phone,
      kind: body.kind !== undefined ? body.kind : prev.kind,
      active: body.active !== undefined ? body.active : prev.active,
      status: body.status !== undefined ? body.status : prev.status,
      inviteToken: body.inviteToken !== undefined ? body.inviteToken : prev.inviteToken,
      access,
      caseScope,
      allowedCaseIds,
      id: prev.id,
      createdAt: prev.createdAt,
    };
    demoSubAccounts = demoSubAccounts.map(a => (a.id === id ? merged : a));
    return json(merged);
  }
  if (byId && req.method === 'DELETE') {
    const id = Number(byId[1]);
    const exists = demoSubAccounts.some(a => a.id === id);
    if (!exists) return json({ message: 'Sub-account not found' }, 404);
    demoSubAccounts = demoSubAccounts.filter(a => a.id !== id);
    return of(new HttpResponse({ status: 204, url: req.url }));
  }

  return next(req);
};
