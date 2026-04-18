import { Injectable } from '@angular/core';
import { DeadlinesStateService } from './services/deadlines-state.service';
import { OutcomesStateService } from './services/outcomes-state.service';
import { PreparationStateService } from './services/preparation-state.service';
import { SessionsStateService } from './services/sessions-state.service';

/**
 * Eagerly constructs court-sessions state services so `CASE_SELECTED` listeners,
 * session reminders, and deadline polling register without visiting a UI route first.
 */
@Injectable({ providedIn: 'root' })
export class CourtSessionsFeatureInitService {
  constructor(
    _sessions: SessionsStateService,
    _preparation: PreparationStateService,
    _outcomes: OutcomesStateService,
    _deadlines: DeadlinesStateService,
  ) {}
}
