import { Injectable } from '@angular/core';
import { ExpensesStateService } from './expenses-state.service';
import { InvoicesStateService } from './invoices-state.service';
import { TimeTrackingStateService } from './time-tracking-state.service';

/**
 * Eagerly constructs financial state services so CASE_SELECTED / cross-feature
 * listeners register without requiring a financial UI route first.
 */
@Injectable({ providedIn: 'root' })
export class FinancialFeatureInitService {
  constructor(
    _invoices: InvoicesStateService,
    _time: TimeTrackingStateService,
    _expenses: ExpensesStateService,
  ) {}
}
