import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { EventService } from '../services/event.service';
import { AppEventType } from '../models/events.model';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const events = inject(EventService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const errorData = {
        status: error.status,
        message: error.error?.message || error.message || 'Une erreur est survenue',
        code: error.error?.code,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString(),
      };

      // Emit error event for UI components to handle
      events.emit(AppEventType.API_ERROR, errorData);

      // Log detailed error for debugging
      if (error.status >= 500) {
        console.error(`[API Server Error] ${errorData.method} ${errorData.url}: ${errorData.message}`);
      } else if (error.status === 404) {
        console.warn(`[API Not Found] ${errorData.method} ${errorData.url}`);
      } else if (error.status === 403) {
        console.warn(`[API Forbidden] ${errorData.method} ${errorData.url}`);
      }

      return throwError(() => errorData);
    })
  );
};
