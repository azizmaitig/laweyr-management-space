import { Injectable, inject, OnDestroy } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { EventService } from './event.service';
import { AppEventType } from '../models/events.model';
import { environment } from '../../../environments/environment';

export interface RealtimeMessage {
  type: string;
  data: unknown;
  timestamp: string;
}

/**
 * RealtimeService - WebSocket / Server-Sent Events placeholder
 * 
 * When Spring Boot backend is ready:
 * 1. Connect to ws://{host}/ws or /sse endpoint
 * 2. Parse incoming messages
 * 3. Emit to EventService for UI updates
 * 
 * Current: Mock implementation that emits events locally
 */
@Injectable({ providedIn: 'root' })
export class RealtimeService implements OnDestroy {
  private events = inject(EventService);
  private messageBus = new Subject<RealtimeMessage>();
  private ws: WebSocket | null = null;
  private connected = false;

  messages$ = this.messageBus.asObservable();

  /**
   * Connect to WebSocket server
   * Call this after successful login
   */
  connect(): void {
    if (this.connected) return;

    // When backend is ready, uncomment:
    // const wsUrl = environment.apiUrl.replace('http', 'ws').replace('https', 'wss');
    // this.ws = new WebSocket(`${wsUrl}/ws`);
    // 
    // this.ws.onopen = () => {
    //   this.connected = true;
    //   console.log('[Realtime] Connected to WebSocket');
    // };
    // 
    // this.ws.onmessage = (event) => {
    //   const message: RealtimeMessage = JSON.parse(event.data);
    //   this.messageBus.next(message);
    //   this.handleMessage(message);
    // };
    // 
    // this.ws.onclose = () => {
    //   this.connected = false;
    //   console.log('[Realtime] Disconnected from WebSocket');
    //   // Auto-reconnect after 5 seconds
    //   setTimeout(() => this.connect(), 5000);
    // };

    console.log('[Realtime] WebSocket connection placeholder (backend not ready)');
  }

  /**
   * Disconnect from WebSocket server
   * Call this on logout
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
  }

  /**
   * Send a message to the server
   */
  send(type: string, data: unknown): void {
    if (this.ws && this.connected) {
      this.ws.send(JSON.stringify({ type, data }));
    }
  }

  /**
   * Subscribe to a specific event type
   */
  on<T>(type: string): Observable<T> {
    return this.messages$.pipe(
      filter((m: RealtimeMessage) => m.type === type),
      map((m: RealtimeMessage) => m.data as T)
    );
  }

  /**
   * Handle incoming realtime messages
   * Map backend event types to frontend AppEventType
   */
  private handleMessage(message: RealtimeMessage): void {
    const eventMap: Record<string, AppEventType> = {
      'case.created': AppEventType.CASE_CREATED,
      'case.updated': AppEventType.CASE_UPDATED,
      'case.deleted': AppEventType.CASE_DELETED,
      'task.created': AppEventType.TASK_CREATED,
      'task.completed': AppEventType.TASK_COMPLETED,
      'task.deleted': AppEventType.TASK_DELETED,
      'document.uploaded': AppEventType.DOCUMENT_UPLOADED,
      'document.deleted': AppEventType.DOCUMENT_DELETED,
      'note.created': AppEventType.NOTE_ADDED,
      'note.updated': AppEventType.NOTE_UPDATED,
      'note.deleted': AppEventType.NOTE_DELETED,
      'timeline.event_added': AppEventType.TIMELINE_EVENT_ADDED,
    };

    const eventType = eventMap[message.type];
    if (eventType) {
      this.events.emit(eventType, message.data);
    }
  }

  /**
   * Simulate a realtime event (for testing)
   */
  simulateEvent(type: AppEventType, data: unknown): void {
    this.events.emit(type, data);
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.messageBus.complete();
  }
}
