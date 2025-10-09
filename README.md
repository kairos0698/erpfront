# SystemErp.Client

Sistema ERP desarrollado con Angular 20, PrimeNG 20 y Tailwind CSS.

## 🚀 Características

- **Angular 20** - Framework moderno y optimizado
- **PrimeNG 20** - Componentes UI profesionales
- **Tailwind CSS** - Estilos utilitarios
- **Arquitectura Limpia** - Separación por módulos y dominios
- **Lazy Loading** - Carga perezosa de módulos
- **Virtual Scroll** - Optimización para grandes datasets
- **Modo Oscuro/Claro** - Soporte completo de temas PrimeNG

## 📁 Estructura del Proyecto

```
SystemErp.Client/
├── src/app/
│   ├── core/                  # Servicios globales, interceptors, guards
│   ├── shared/                # Componentes y pipes reutilizables
│   ├── features/              # Módulos por dominio
│   │   ├── empresas/
│   │   │   ├── components/    # List, Edit, Create, Details
│   │   │   ├── services/      # Servicios para consumir API
│   │   │   └── models/         # Interfaces TypeScript para DTOs
│   │   ├── usuarios/
│   │   └── productos/
│   ├── app.routes.ts          # Configuración de rutas
│   └── app.config.ts          # Configuración de la aplicación
├── tailwind.config.js         # Configuración de Tailwind CSS
├── angular.json               # Configuración de Angular
└── package.json               # Dependencias del proyecto
```

## 🛠️ Instalación y Configuración

### Prerrequisitos
- Node.js 20+ 
- Angular CLI 20
- npm o yarn

### Instalación
```bash
# Clonar el repositorio
git clone <repository-url>
cd SystemErp.Client

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
ng serve
```

### Dependencias Principales
```bash
# PrimeNG y PrimeIcons
npm install primeng@20 primeicons@6

# Tailwind CSS
npm install tailwindcss postcss autoprefixer

# Flex Layout (opcional)
npm install @angular/flex-layout
```

## 🎨 Configuración de Estilos

### Tailwind CSS
El proyecto está configurado con Tailwind CSS. Los estilos se importan en `src/styles.scss`:

```scss
/* Tailwind CSS */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* PrimeNG Themes */
@import "primeng/resources/themes/lara-light-indigo/theme.css";
@import "primeng/resources/primeng.min.css";
@import "primeicons/primeicons.css";
```

### Modo Oscuro/Claro
PrimeNG maneja automáticamente los temas. Para cambiar entre modo claro y oscuro, simplemente cambia el tema en `styles.scss`:

```scss
/* Modo Claro */
@import "primeng/resources/themes/lara-light-indigo/theme.css";

/* Modo Oscuro */
@import "primeng/resources/themes/lara-dark-indigo/theme.css";
```

## 🏗️ Cómo Agregar un Nuevo Módulo/Entidad

### 1. Crear la Estructura del Módulo
```bash
# Crear carpetas
mkdir src/app/features/nueva-entidad
mkdir src/app/features/nueva-entidad/components
mkdir src/app/features/nueva-entidad/services
mkdir src/app/features/nueva-entidad/models
```

### 2. Generar Componentes
```bash
# Generar componentes CRUD
ng generate component features/nueva-entidad/components/nueva-entidad-list
ng generate component features/nueva-entidad/components/nueva-entidad-create
ng generate component features/nueva-entidad/components/nueva-entidad-edit
ng generate component features/nueva-entidad/components/nueva-entidad-details
```

### 3. Generar Servicio
```bash
ng generate service features/nueva-entidad/services/nueva-entidad
```

### 4. Crear Modelos/DTOs
Crear archivo `src/app/features/nueva-entidad/models/nueva-entidad.dto.ts`:

```typescript
export interface NuevaEntidadDto {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
  fechaCreacion: Date;
}

export interface CreateNuevaEntidadDto {
  nombre: string;
  descripcion: string;
}

export interface UpdateNuevaEntidadDto {
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
}
```

### 5. Configurar Rutas
Crear `src/app/features/nueva-entidad/nueva-entidad.module.ts`:

```typescript
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

// Importar componentes y servicios
import { NuevaEntidadList } from './components/nueva-entidad-list/nueva-entidad-list';
import { NuevaEntidadService } from './services/nueva-entidad';

const routes: Routes = [
  { path: '', component: NuevaEntidadList },
  { path: 'create', component: NuevaEntidadCreate },
  { path: 'edit/:id', component: NuevaEntidadEdit },
  { path: 'details/:id', component: NuevaEntidadDetails }
];

@NgModule({
  declarations: [
    NuevaEntidadList,
    NuevaEntidadCreate,
    NuevaEntidadEdit,
    NuevaEntidadDetails
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    // Importar módulos de PrimeNG necesarios
  ],
  providers: [NuevaEntidadService]
})
export class NuevaEntidadModule { }
```

### 6. Agregar Ruta al App
Actualizar `src/app/app.routes.ts`:

```typescript
export const routes: Routes = [
  {
    path: 'nueva-entidad',
    loadChildren: () => import('./features/nueva-entidad/nueva-entidad.module').then(m => m.NuevaEntidadModule)
  }
];
```

## 🔌 Conectar un Módulo a la API

### 1. Configurar el Servicio
```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NuevaEntidadDto } from '../models/nueva-entidad.dto';

@Injectable({
  providedIn: 'root'
})
export class NuevaEntidadService {
  private readonly apiUrl = 'https://localhost:7000/api/nueva-entidad';

  constructor(private http: HttpClient) { }

  getAll(): Observable<NuevaEntidadDto[]> {
    return this.http.get<NuevaEntidadDto[]>(this.apiUrl);
  }

  getById(id: number): Observable<NuevaEntidadDto> {
    return this.http.get<NuevaEntidadDto>(`${this.apiUrl}/${id}`);
  }

  create(entidad: CreateNuevaEntidadDto): Observable<NuevaEntidadDto> {
    return this.http.post<NuevaEntidadDto>(this.apiUrl, entidad);
  }

  update(id: number, entidad: UpdateNuevaEntidadDto): Observable<NuevaEntidadDto> {
    return this.http.put<NuevaEntidadDto>(`${this.apiUrl}/${id}`, entidad);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
```

### 2. Implementar Tabla PrimeNG
```html
<p-table [value]="entidades" [loading]="loading" [paginator]="true" [rows]="10">
  <ng-template pTemplate="header">
    <tr>
      <th>ID</th>
      <th>Nombre</th>
      <th>Descripción</th>
      <th>Estado</th>
      <th>Acciones</th>
    </tr>
  </ng-template>
  
  <ng-template pTemplate="body" let-entidad>
    <tr>
      <td>{{entidad.id}}</td>
      <td>{{entidad.nombre}}</td>
      <td>{{entidad.descripcion}}</td>
      <td>
        <p-tag [value]="entidad.activo ? 'Activo' : 'Inactivo'" 
               [severity]="entidad.activo ? 'success' : 'danger'">
        </p-tag>
      </td>
      <td>
        <p-button icon="pi pi-pencil" [text]="true" severity="info"></p-button>
        <p-button icon="pi pi-trash" [text]="true" severity="danger"></p-button>
      </td>
    </tr>
  </ng-template>
</p-table>
```

## 🚀 Comandos Útiles

### Generar Componentes
```bash
# Generar componente standalone
ng generate component features/entidad/components/entidad-list --standalone

# Generar con especificaciones
ng generate component features/entidad/components/entidad-list --skip-tests
```

### Generar Servicios
```bash
ng generate service features/entidad/services/entidad
```

### Generar Módulos
```bash
ng generate module features/entidad --route entidad
```

### Ejecutar el Proyecto
```bash
# Desarrollo
ng serve

# Producción
ng build --configuration production

# Linting
ng lint

# Testing
ng test
```

## 🎯 Optimizaciones Implementadas

### Virtual Scroll
Para tablas con muchos datos, usar `p-table` con `[virtualScroll]="true"`:

```html
<p-table [value]="datos" [virtualScroll]="true" [scrollable]="true" scrollHeight="400px">
```

### Lazy Loading
Todos los módulos están configurados con lazy loading para mejorar el rendimiento inicial.

### Componentes Reutilizables
Crear componentes reutilizables en `src/app/shared/` para inputs, botones y formularios comunes.

## 🔧 Configuración del Backend

El proyecto está configurado para conectarse a un backend en `https://localhost:7000`. Para cambiar la URL base, actualiza la variable `apiUrl` en cada servicio.

## 📝 Notas Importantes

- **No uses colores directos de Tailwind** - Usa los temas de PrimeNG para mantener consistencia
- **Sigue la arquitectura limpia** - Separa componentes, servicios y modelos
- **Usa lazy loading** - Para todos los módulos de features
- **Implementa virtual scroll** - Para tablas con muchos datos
- **Mantén consistencia** - Usa los mismos patrones en todos los módulos

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.