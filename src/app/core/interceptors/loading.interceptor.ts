import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { EventService } from '../services/event.service';
import { AppEventType } from '../models/events.model';

let activeRequests = 0;

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const events = inject(EventService);

  // Skip loading tracking for certain requests
  const skipUrls = ['/auth/refresh'];
  if (skipUrls.some(url => req.url.includes(url))) {
    return next(req);
  }

  activeRequests++;
  events.emit(AppEventType.LOADING_START, { count: activeRequests });

  return next(req).pipe(
    finalize(() => {
      activeRequests--;
      events.emit(AppEventType.LOADING_COMPLETE, { count: activeRequests });
    })
  );
};

export function getActiveRequestCount(): number {
  return activeRequests;
}
