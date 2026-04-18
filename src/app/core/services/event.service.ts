import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { AppEvent, AppEventType } from '../models/events.model';

@Injectable({ providedIn: 'root' })
export class EventService {
  private eventBus = new Subject<AppEvent>();
  events$ = this.eventBus.asObservable();

  emit<T>(type: AppEventType, payload?: T) {
    this.eventBus.next({ type, payload, timestamp: new Date() });
  }

  on<T>(type: AppEventType): Observable<T> {
    return this.events$.pipe(
      filter(e => e.type === type),
      map(e => e.payload as T)
    );
  }

  onAny(): Observable<AppEvent> {
    return this.events$;
  }
}
