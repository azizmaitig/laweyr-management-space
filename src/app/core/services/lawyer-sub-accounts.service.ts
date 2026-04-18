import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, finalize, map, type Observable, of, tap } from 'rxjs';
import type { LawyerSubAccount, SubAccountAccess, SubAccountKind } from '../models/lawyer-subaccount.model';
import { normalizeSubAccountAccess } from '../models/lawyer-subaccount.model';
import type { PatchLawyerSubAccountDto } from './lawyer-sub-accounts-api.service';
import { LawyerSubAccountsApiService } from './lawyer-sub-accounts-api.service';

/**
 * Sub-accounts for the current lawyer — backed by HTTP with optimistic updates and rollback on error.
 * @see API_ENDPOINTS.LAWYER_ME_SUB_ACCOUNTS
 */
@Injectable({ providedIn: 'root' })
export class LawyerSubAccountsService {
  private api = inject(LawyerSubAccountsApiService);

  private list = signal<LawyerSubAccount[]>([]);
  readonly accounts = computed(() => this.list());
  /** Initial GET */
  readonly loading = signal(false);
  /** Any write (POST/PATCH/DELETE) in flight */
  readonly syncInFlight = signal(false);
  readonly error = signal<string | null>(null);

  private tempSeq = 0;

  private nextTempId(): number {
    this.tempSeq += 1;
    return -this.tempSeq;
  }

  private snapshot(): LawyerSubAccount[] {
    return this.list().map(a => ({ ...a, access: [...a.access] }));
  }

  private fail(err: unknown): void {
    const e = err as { message?: string };
    this.error.set(e?.message ?? 'Échec de la synchronisation');
  }

  clearError(): void {
    this.error.set(null);
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .list()
      .pipe(
        tap(rows => this.list.set(rows)),
        catchError(err => {
          this.fail(err);
          return of(null);
        }),
        finalize(() => this.loading.set(false))
      )
      .subscribe();
  }

  listFiltered(kind: SubAccountKind | 'ALL'): LawyerSubAccount[] {
    const rows = this.list();
    if (kind === 'ALL') return rows;
    return rows.filter(a => a.kind === kind);
  }

  /**
   * Creates sub-account (server returns PENDING + inviteToken). Emits created row or null on failure.
   */
  add(draft: {
    name: string;
    email: string;
    phone?: string;
    kind: SubAccountKind;
    access: SubAccountAccess[];
    caseScope?: 'ALL' | 'SELECTED';
    allowedCaseIds?: number[];
  }): Observable<LawyerSubAccount | null> {
    this.error.set(null);
    const normalized = normalizeSubAccountAccess(draft.access);
    const tempId = this.nextTempId();
    const optimistic: LawyerSubAccount = {
      id: tempId,
      name: draft.name.trim(),
      email: draft.email.trim(),
      phone: draft.phone?.trim() || undefined,
      kind: draft.kind,
      access: normalized,
      caseScope: draft.caseScope ?? 'ALL',
      allowedCaseIds: draft.caseScope === 'SELECTED' ? [...(draft.allowedCaseIds ?? [])] : undefined,
      createdAt: new Date().toISOString(),
      active: true,
      status: 'PENDING',
    };
    const snap = this.snapshot();
    this.list.update(cur => [...cur, optimistic]);
    this.syncInFlight.set(true);
    return this.api
      .create({
        name: optimistic.name,
        email: optimistic.email,
        phone: optimistic.phone,
        kind: optimistic.kind,
        access: normalized,
        caseScope: optimistic.caseScope,
        allowedCaseIds: optimistic.allowedCaseIds,
      })
      .pipe(
        tap(created => this.list.update(cur => cur.map(a => (a.id === tempId ? created : a)))),
        map(created => created),
        catchError(err => {
          this.list.set(snap);
          this.fail(err);
          return of(null);
        }),
        finalize(() => this.syncInFlight.set(false))
      );
  }

  sendInviteEmail(id: number): Observable<void> {
    return this.api.sendInviteEmail(id);
  }

  update(
    id: number,
    patch: Partial<Pick<LawyerSubAccount, 'name' | 'email' | 'phone' | 'access' | 'caseScope' | 'allowedCaseIds' | 'active'>>,
  ): void {
    if (id < 0) return;
    const dto = this.toPatchDto(patch);
    if (Object.keys(dto).length === 0) return;

    this.error.set(null);
    const snap = this.snapshot();
    this.list.update(cur =>
      cur.map(a => {
        if (a.id !== id) return a;
        const access = patch.access != null ? normalizeSubAccountAccess(patch.access) : a.access;
        const caseScope = patch.caseScope ?? a.caseScope ?? 'ALL';
        const allowedCaseIds =
          caseScope === 'SELECTED'
            ? [...(patch.allowedCaseIds ?? a.allowedCaseIds ?? [])]
            : undefined;
        return { ...a, ...patch, access, caseScope, allowedCaseIds };
      })
    );

    this.syncInFlight.set(true);
    this.api
      .updatePartial(id, dto)
      .pipe(
        tap(saved => this.list.update(cur => cur.map(a => (a.id === id ? saved : a)))),
        catchError(err => {
          this.list.set(snap);
          this.fail(err);
          return of(null);
        }),
        finalize(() => this.syncInFlight.set(false))
      )
      .subscribe();
  }

  private toPatchDto(
    patch: Partial<Pick<LawyerSubAccount, 'name' | 'email' | 'phone' | 'access' | 'caseScope' | 'allowedCaseIds' | 'active'>>
  ): PatchLawyerSubAccountDto {
    const dto: PatchLawyerSubAccountDto = {};
    if (patch.name !== undefined) dto.name = patch.name;
    if (patch.email !== undefined) dto.email = patch.email;
    if (patch.phone !== undefined) dto.phone = patch.phone;
    if (patch.active !== undefined) dto.active = patch.active;
    if (patch.access !== undefined) dto.access = normalizeSubAccountAccess(patch.access);
    if (patch.caseScope !== undefined) dto.caseScope = patch.caseScope;
    if (patch.allowedCaseIds !== undefined) dto.allowedCaseIds = patch.allowedCaseIds;
    return dto;
  }

  updateAccess(id: number, access: SubAccountAccess[]): void {
    this.update(id, { access: normalizeSubAccountAccess(access) });
  }

  remove(id: number): void {
    if (id < 0) {
      this.list.update(cur => cur.filter(a => a.id !== id));
      return;
    }
    this.error.set(null);
    const snap = this.snapshot();
    this.list.update(cur => cur.filter(a => a.id !== id));
    this.syncInFlight.set(true);
    this.api
      .remove(id)
      .pipe(
        catchError(err => {
          this.list.set(snap);
          this.fail(err);
          return of(null);
        }),
        finalize(() => this.syncInFlight.set(false))
      )
      .subscribe();
  }

  setActive(id: number, active: boolean): void {
    this.update(id, { active });
  }
}
