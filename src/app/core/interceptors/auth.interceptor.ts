import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { SessionExpiredService } from '../services/session-expired.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const sessionExpiredService = inject(SessionExpiredService);
  
  // Verificar si el token está expirado antes de hacer la petición
  const token = authService.getToken();
  if (token) {
    // Verificar si el token está expirado usando el método del servicio
    if (authService.isTokenExpired()) {
      // Token expirado: mostrar modal y no hacer la petición
      sessionExpiredService.showSessionExpiredModal();
      return throwError(() => new Error('Token expired'));
    }
    
    // Token válido: agregar header de autorización
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Ignorar errores 401 de la ruta de login - deben ser manejados por el componente de login
        const isLoginRequest = req.url.includes('/Auth/login') || req.url.includes('/login');
        
        if (!isLoginRequest) {
          // Verificar si es un error de autorización (sin permisos) o autenticación (token inválido)
          const errorMessage = error.error?.message || error.message || '';
          const isAuthorizationError = errorMessage.includes('No se pueden editar') || 
                                     errorMessage.includes('No se pueden eliminar') ||
                                     errorMessage.includes('No tienes permiso') ||
                                     errorMessage.includes('pertenece a tu organización');
          
          // Solo mostrar modal de sesión expirada si NO es un error de autorización
          // Los errores de autorización deben mostrarse al usuario, no redirigir
          if (!isAuthorizationError) {
            // Verificar si el token está expirado usando el método del servicio
            if (authService.isTokenExpired()) {
              // Token expirado: mostrar modal de sesión expirada
              sessionExpiredService.showSessionExpiredModal();
            } else {
              // Token inválido pero no expirado: hacer logout directamente
              authService.logout();
              window.location.href = '/login';
            }
          }
        }
      }
      return throwError(() => error);
    })
  );
};
