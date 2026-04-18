import { Injectable } from '@angular/core';
import { AgendaStateService } from './services/agenda-state.service';
import { ReminderStateService } from './services/reminder-state.service';

/**
 * Eagerly constructs agenda & reminder state services so event listeners
 * (CASE_SELECTED, session reminders, deadline alerts) register without
 * visiting the agenda UI route first.
 */
@Injectable({ providedIn: 'root' })
export class AgendaFeatureInitService {
  constructor(
    _agenda: AgendaStateService,
    _reminders: ReminderStateService,
  ) {}
}
