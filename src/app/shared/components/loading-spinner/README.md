# Loading Spinner - Sistema Global de Carga

Este sistema proporciona un spinner de carga global que se activa automáticamente durante todas las peticiones HTTP del sistema.

## 🎯 Características

- ✅ **Activación automática**: Se activa automáticamente en todas las peticiones HTTP
- ✅ **Contador inteligente**: Maneja múltiples peticiones simultáneas
- ✅ **Interfaz no bloqueante**: Overlay con blur para mejor UX
- ✅ **Accesible**: Compatible con lectores de pantalla
- ✅ **Modo oscuro**: Soporte para tema oscuro/claro

## 📦 Componentes

### 1. LoadingService
Servicio que maneja el estado global del spinner.

```typescript
import { LoadingService } from '@shared/services/loading.service';

constructor(private loadingService: LoadingService) {}

// Activar manualmente (si es necesario)
this.loadingService.show();

// Desactivar manualmente
this.loadingService.hide();

// Resetear contador
this.loadingService.reset();

// Observar estado
this.loadingService.loading$.subscribe(isLoading => {
  console.log('Cargando:', isLoading);
});
```

### 2. LoadingSpinnerComponent
Componente visual del spinner. Ya está incluido en `app.component.ts`.

### 3. LoadingInterceptor
Interceptor HTTP que activa/desactiva el spinner automáticamente.

### 4. LoadingButtonDirective
Directiva opcional para deshabilitar botones durante la carga.

```html
<!-- Uso básico -->
<button appLoadingButton>Guardar</button>

<!-- Con PrimeNG Button -->
<p-button label="Guardar" appLoadingButton (click)="save()"></p-button>
```

## 🚀 Uso Automático

El spinner se activa **automáticamente** en todas las peticiones HTTP gracias al interceptor. No necesitas hacer nada adicional.

### Ejemplo de uso en servicios:

```typescript
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export class MyService {
  constructor(private http: HttpClient) {}

  // El spinner se activa automáticamente
  getData(): Observable<any> {
    return this.http.get('/api/data');
    // El spinner se desactiva automáticamente cuando termina
  }

  // También funciona con POST, PUT, DELETE, etc.
  saveData(data: any): Observable<any> {
    return this.http.post('/api/data', data);
  }
}
```

## 🎨 Personalización

### Excluir URLs del spinner

Si necesitas excluir ciertas URLs del spinner (por ejemplo, polling), edita `loading.interceptor.ts`:

```typescript
const excludeUrls = [
  '/api/health-check',
  '/api/notifications/poll'
];
```

### Uso manual del servicio

Si necesitas control manual del spinner para operaciones que no son HTTP:

```typescript
import { LoadingService } from '@shared/services/loading.service';

export class MyComponent {
  constructor(private loadingService: LoadingService) {}

  async processData() {
    this.loadingService.show();
    try {
      // Tu lógica aquí
      await this.heavyComputation();
    } finally {
      this.loadingService.hide();
    }
  }
}
```

## 📝 Notas Importantes

1. **No necesitas importar nada en tus componentes** - El interceptor funciona automáticamente
2. **El spinner previene doble clicks** - Los botones se deshabilitan automáticamente durante la carga
3. **Múltiples peticiones** - El contador maneja múltiples peticiones simultáneas correctamente
4. **Performance** - El spinner solo se muestra cuando hay peticiones activas

## 🔧 Configuración

El sistema ya está configurado en:
- ✅ `app.config.ts` - Interceptor registrado
- ✅ `app.component.ts` - Componente del spinner incluido
- ✅ `loading.service.ts` - Servicio disponible globalmente

## 🎯 Ejemplos de Uso

### Ejemplo 1: Consulta de datos
```typescript
// En tu componente
this.myService.getData().subscribe({
  next: (data) => {
    // El spinner se desactiva automáticamente
    this.data = data;
  },
  error: (error) => {
    // El spinner se desactiva automáticamente incluso en errores
    console.error(error);
  }
});
```

### Ejemplo 2: Guardar datos
```typescript
// En tu componente
this.myService.saveData(formData).subscribe({
  next: () => {
    // El spinner se desactiva automáticamente
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Datos guardados correctamente'
    });
  }
});
```

### Ejemplo 3: Deshabilitar botones manualmente
```typescript
// En tu componente
isSaving = false;

save() {
  this.isSaving = true;
  this.myService.saveData(data).subscribe({
    next: () => {
      this.isSaving = false;
    },
    error: () => {
      this.isSaving = false;
    }
  });
}
```

```html
<p-button 
  label="Guardar" 
  [disabled]="isSaving"
  (click)="save()">
</p-button>
```

## ✨ Ventajas

- 🚀 **Automático**: No necesitas configurar nada en cada componente
- 🛡️ **Previene errores**: Evita doble clicks y peticiones duplicadas
- 🎨 **Consistente**: Mismo comportamiento en toda la aplicación
- ♿ **Accesible**: Cumple con estándares de accesibilidad
- 📱 **Responsive**: Funciona en todos los dispositivos

