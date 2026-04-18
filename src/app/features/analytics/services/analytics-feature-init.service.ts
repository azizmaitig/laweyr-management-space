import { Injectable } from '@angular/core';
import { AnalyticsStateService } from './analytics-state.service';
import { CaseExportEventBridgeService } from './case-export-event-bridge.service';

/**
 * Eagerly constructs analytics + export bridge so {@link AnalyticsStateService} listeners
 * and export event handlers register without visiting `/espace-avocat/stats` first.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsFeatureInitService {
  constructor(
    _analytics: AnalyticsStateService,
    _exportBridge: CaseExportEventBridgeService,
  ) {}
}
