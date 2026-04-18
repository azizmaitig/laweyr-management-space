/**
 * Event integration examples — not imported by the app.
 *
 * Orchestration rule: react to court-session deadlines via {@link EventService} only
 * (do not inject timeline or notification services from here).
 */
import { Subscription } from 'rxjs';
import type { CourtSessionEventPayload } from '../../core/models';
import { AppEventType } from '../../core/models/events.model';
import { EventService } from '../../core/services/event.service';

/** Example: log / forward session lifecycle for analytics or a future notification bridge. */
export function exampleSubscribeSessionLifecycle(events: EventService): Subscription {
  const sub = new Subscription();
  sub.add(
    events.on<CourtSessionEventPayload>(AppEventType.SESSION_CREATED).subscribe(p => {
      // e.g. enqueue user-visible toast when a UI layer exists
      console.debug('[SESSION_CREATED]', p.caseId, p.sessionId, p.date);
    })
  );
  return sub;
}

/** Example: listen for procedural deadline escalation windows. */
export function exampleSubscribeDeadlineAlerts(events: EventService): Subscription {
  const sub = new Subscription();
  sub.add(
    events.on<CourtSessionEventPayload>(AppEventType.DEADLINE_APPROACHING).subscribe(p => {
      console.debug('[DEADLINE_APPROACHING]', p.deadlineId, p.title, p.alertWindow);
    })
  );
  sub.add(
    events.on<CourtSessionEventPayload>(AppEventType.DEADLINE_WARNING).subscribe(p => {
      console.debug('[DEADLINE_WARNING]', p.deadlineId, p.title, p.alertWindow);
    })
  );
  sub.add(
    events.on<CourtSessionEventPayload>(AppEventType.DEADLINE_CRITICAL).subscribe(p => {
      console.debug('[DEADLINE_CRITICAL]', p.deadlineId, p.title, p.alertWindow);
    })
  );
  return sub;
}

/**
 * Example registration from an injectable (constructor):
 *
 * ```ts
 * constructor(events: EventService) {
 *   exampleSubscribeSessionLifecycle(events).add(exampleSubscribeDeadlineAlerts(events));
 * }
 * ```
 */
