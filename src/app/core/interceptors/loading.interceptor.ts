import { HttpInterceptorFn, HttpRequest, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../../shared/services/loading.service';

export const loadingInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: (req: HttpRequest<unknown>) => Observable<HttpEvent<unknown>>
): Observable<HttpEvent<unknown>> => {
  const loadingService = inject(LoadingService);

  // Excluir ciertas peticiones del spinner si es necesario
  // Por ejemplo, peticiones de polling o actualizaciones en segundo plano
  const excludeUrls: string[] = [
    // Agrega aquí URLs que no deben mostrar el spinner
    // '/api/health-check',
    // '/api/notifications/poll'
  ];

  const shouldShowSpinner = !excludeUrls.some(url => req.url.includes(url));

  if (shouldShowSpinner) {
    // Activar el spinner antes de la petición
    loadingService.show();
  }

  return next(req).pipe(
    finalize(() => {
      // Desactivar el spinner cuando la petición termine (éxito o error)
      if (shouldShowSpinner) {
        loadingService.hide();
      }
    })
  );
};

