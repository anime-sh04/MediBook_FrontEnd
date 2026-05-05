import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getAccessToken();
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        const refreshToken = authService.getRefreshToken();
        if (refreshToken) {
          return authService.refreshToken(refreshToken).pipe(
            switchMap(response => {
              authService.saveTokens(response.accessToken, response.refreshToken);
              const retried = req.clone({
                setHeaders: { Authorization: `Bearer ${response.accessToken}` }
              });
              return next(retried);
            }),
            catchError(refreshError => {
              authService.clearTokens();
              router.navigate(['/login']);
              return throwError(() => refreshError);
            })
          );
        } else {
          authService.clearTokens();
          router.navigate(['/login']);
        }
      }
      return throwError(() => error);
    })
  );
};