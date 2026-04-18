import { Injectable, inject } from '@angular/core';
import { AppEventType } from '../../../core/models/events.model';
import { EventService } from '../../../core/services/event.service';

/**
 * UI integration entry points for case exports. Actual PDF/JSON generation should subscribe
 * to {@link AppEventType.EXPORT_CASE_PDF} / {@link AppEventType.EXPORT_CASE_JSON}.
 */
@Injectable({ providedIn: 'root' })
export class ExportStateService {
  private readonly events = inject(EventService);

  exportCasePDF(caseId: number): void {
    this.events.emit(AppEventType.EXPORT_CASE_PDF, caseId);
  }

  exportCaseJSON(caseId: number): void {
    this.events.emit(AppEventType.EXPORT_CASE_JSON, caseId);
  }
}
