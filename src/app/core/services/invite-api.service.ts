import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { ApiService } from './api.service';

/** sessionStorage key — must match login page capture. */
export const PENDING_SUB_ACCOUNT_INVITE_KEY = 'onat_pending_sub_account_invite';

export interface AcceptInviteResponse {
  subAccountId: number;
}

@Injectable({ providedIn: 'root' })
export class InviteApiService extends ApiService {
  /**
   * Marks the sub-account as ACTIVE after the invitee’s first successful auth.
   * Body: `{ token }` from the invite link query param.
   */
  acceptInvite(token: string): Observable<AcceptInviteResponse> {
    return this.post<AcceptInviteResponse>(API_ENDPOINTS.INVITES.ACCEPT, { token });
  }
}
