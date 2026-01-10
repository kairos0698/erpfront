import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs/operators';
import { CacheService } from '../services/cache.service';

/**
 * Interceptor funcional que escucha el header X-Cache-Invalidated del backend
 * y automáticamente invalida el caché del frontend cuando el backend
 * indica que los datos han cambiado.
 */
export const cacheInvalidationInterceptor: HttpInterceptorFn = (req, next) => {
  const cacheService = inject(CacheService);

  return next(req).pipe(
    tap(event => {
      // Solo procesar respuestas HTTP exitosas
      if (event instanceof HttpResponse) {
        const cacheInvalidated = event.headers.get('X-Cache-Invalidated');
        
        if (cacheInvalidated === 'true') {
          // El backend indica que se invalidó el caché
          // Invalidar todos los cachés relacionados con este endpoint
          const url = event.url || '';
          
          // Extraer el nombre del recurso del URL (ej: /api/Employees -> employees)
          const resourceMatch = url.match(/\/api\/([^\/]+)/);
          if (resourceMatch) {
            const resourceName = resourceMatch[1].toLowerCase();
            
            // Invalidar caché usando el patrón de clave
            // Ejemplo: employees:all, products:all, etc.
            cacheService.invalidateByPrefix(`${resourceName}:`);
            
            console.log(`[CacheInvalidationInterceptor] Caché invalidado para recurso: ${resourceName}`);
          } else {
            // Si no se puede extraer el recurso, invalidar todo el caché
            cacheService.clear();
            console.log('[CacheInvalidationInterceptor] Caché completo invalidado');
          }
        }
      }
    })
  );
};
