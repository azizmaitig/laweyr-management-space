import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Holds the current platform actor (multi-user) for activity attribution.
 * Call {@link setActorUserId} from shell/auth when the session user is known.
 */
@Injectable({ providedIn: 'root' })
export class PlatformSessionService {
  private actorUserId = new BehaviorSubject<number | null>(null);
  actorUserId$ = this.actorUserId.asObservable();

  setActorUserId(id: number | null): void {
    this.actorUserId.next(id);
  }

  getActorUserId(): number | null {
    return this.actorUserId.value;
  }
}
