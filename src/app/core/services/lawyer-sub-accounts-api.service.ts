import { Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import type { LawyerSubAccount, SubAccountAccess, SubAccountKind } from '../models/lawyer-subaccount.model';
import { ApiService } from './api.service';

export interface CreateLawyerSubAccountDto {
  name: string;
  email: string;
  phone?: string;
  kind: SubAccountKind;
  access: SubAccountAccess[];
  caseScope?: 'ALL' | 'SELECTED';
  allowedCaseIds?: number[];
}

export type PatchLawyerSubAccountDto = Partial<
  Pick<
    LawyerSubAccount,
    'name' | 'email' | 'phone' | 'kind' | 'access' | 'caseScope' | 'allowedCaseIds' | 'active' | 'status' | 'inviteToken'
  >
>;

@Injectable({ providedIn: 'root' })
export class LawyerSubAccountsApiService extends ApiService {
  private readonly base = API_ENDPOINTS.LAWYER_ME_SUB_ACCOUNTS.BASE;

  list(): Observable<LawyerSubAccount[]> {
    return this.get<LawyerSubAccount[]>(this.base);
  }

  create(body: CreateLawyerSubAccountDto): Observable<LawyerSubAccount> {
    return this.post<LawyerSubAccount>(this.base, body);
  }

  updatePartial(id: number, body: PatchLawyerSubAccountDto): Observable<LawyerSubAccount> {
    return super.patch<LawyerSubAccount>(API_ENDPOINTS.LAWYER_ME_SUB_ACCOUNTS.BY_ID(id), body);
  }

  remove(id: number): Observable<void> {
    return super.delete<void>(API_ENDPOINTS.LAWYER_ME_SUB_ACCOUNTS.BY_ID(id));
  }

  /** Queue invitation email (backend sends link with token). */
  sendInviteEmail(id: number): Observable<void> {
    return this.post<{ ok?: boolean }>(API_ENDPOINTS.LAWYER_ME_SUB_ACCOUNTS.SEND_INVITE(id), {}).pipe(
      map(() => undefined)
    );
  }
}
