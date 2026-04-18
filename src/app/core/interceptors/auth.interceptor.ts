import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthStateService } from '../services/auth-state.service';
import { EventService } from '../services/event.service';
import { AppEventType } from '../models/events.model';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);
  const events = inject(EventService);
  const token = authState.token;

  // Skip auth for public endpoints
  const publicUrls = ['/auth/login', '/auth/register'];
  if (publicUrls.some(url => req.url.includes(url))) {
    return next(req);
  }

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError(err => {
      if (err.status === 401) {
        authState.logout();
        router.navigate(['/login']);
        events.emit(AppEventType.AUTH_LOGOUT);
      }
      return throwError(() => err);
    })
  );
};
