import { Injectable, inject } from '@angular/core';
import { DataService } from '../../../core/services/data.service';
import { CaseTimelineEvent } from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class TimelineService {
  private data = inject(DataService);

  getAll(): CaseTimelineEvent[] {
    return this.data.timelineEvents;
  }

  getByCaseId(caseId: number): CaseTimelineEvent[] {
    return this.data.getTimelineEvents(caseId);
  }

  add(event: CaseTimelineEvent) {
    this.data.timelineEvents.push(event);
  }

  delete(id: number) {
    this.data.timelineEvents = this.data.timelineEvents.filter(e => e.id !== id);
  }
}
