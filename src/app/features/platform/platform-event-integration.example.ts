/**
 * Event integration examples — not imported by the app.
 *
 * Orchestration: react to platform lifecycle only via {@link EventService}
 * (do not inject platform state services from unrelated features).
 */
import { Subscription } from 'rxjs';
import type {
  BackupLifecyclePayload,
  SettingsUpdatedPayload,
  UserCreatedPayload,
} from '../../core/models/platform-events.model';
import { AppEventType } from '../../core/models/events.model';
import { EventService } from '../../core/services/event.service';

/** Example: audit hook when a collaborator is added. */
export function exampleSubscribeUserCreated(events: EventService): Subscription {
  return events.on<UserCreatedPayload>(AppEventType.USER_CREATED).subscribe(p => {
    console.debug('[USER_CREATED]', p.userId, p.entityId);
  });
}

/** Example: forward backup outcome to external monitoring. */
export function exampleSubscribeBackupLifecycle(events: EventService): Subscription {
  const sub = new Subscription();
  sub.add(
    events.on<BackupLifecyclePayload>(AppEventType.BACKUP_SUCCESS).subscribe(p => {
      console.debug('[BACKUP_SUCCESS]', p.entityId, p.location, p.status);
    })
  );
  sub.add(
    events.on<BackupLifecyclePayload>(AppEventType.BACKUP_FAILED).subscribe(p => {
      console.warn('[BACKUP_FAILED]', p.message, p.status);
    })
  );
  return sub;
}

/** Example: theme bridge — apply CSS variables when settings change. */
export function exampleSubscribeSettingsUpdated(events: EventService): Subscription {
  return events.on<SettingsUpdatedPayload>(AppEventType.SETTINGS_UPDATED).subscribe(p => {
    console.debug('[SETTINGS_UPDATED]', p.userId, p.status);
  });
}

/**
 * Example registration from an injectable constructor:
 *
 * ```ts
 * constructor(events: EventService) {
 *   exampleSubscribeUserCreated(events).add(exampleSubscribeBackupLifecycle(events));
 * }
 * ```
 */
