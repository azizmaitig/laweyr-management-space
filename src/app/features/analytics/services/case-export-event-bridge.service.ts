import { Injectable, OnDestroy, inject, isDevMode } from '@angular/core';
import { Subscription } from 'rxjs';
import { AppEventType } from '../../../core/models/events.model';
import { EventService } from '../../../core/services/event.service';

/**
 * Subscribes to export request events from {@link ExportStateService}.
 * Replace the bodies with HTTP + file download when the backend exposes export endpoints.
 */
@Injectable({ providedIn: 'root' })
export class CaseExportEventBridgeService implements OnDestroy {
  private readonly events = inject(EventService);
  private readonly subscriptions = new Subscription();

  constructor() {
    this.subscriptions.add(
      this.events.on<number>(AppEventType.EXPORT_CASE_PDF).subscribe(caseId => {
        if (isDevMode()) {
          console.info('[CaseExportEventBridge] PDF export requested', { caseId });
        }
      })
    );
    this.subscriptions.add(
      this.events.on<number>(AppEventType.EXPORT_CASE_JSON).subscribe(caseId => {
        if (isDevMode()) {
          console.info('[CaseExportEventBridge] JSON export requested', { caseId });
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
