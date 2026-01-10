import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, shareReplay } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { EmployeeDto, EmployeeResponseDto, PagedResult, EmployeeFilters } from '../models/employee.model';
import { ApiResponse } from '../../../../shared/models/api-response.model';
import { CacheService } from '../../../../shared/services/cache.service';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = `${environment.apiUrl}/Employees`;
  private readonly CACHE_KEY_ALL = 'employees:all';
  private readonly CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutos (datos más dinámicos)
  
  // OPTIMIZACIÓN: BehaviorSubject para compartir datos entre componentes sin múltiples llamadas HTTP
  private employeesSubject = new BehaviorSubject<ApiResponse<EmployeeResponseDto[]> | null>(null);
  public employees$ = this.employeesSubject.asObservable();
  private isLoading = false;

  constructor(
    private http: HttpClient,
    private cacheService: CacheService
  ) {}

  // Obtener todos los empleados - OPTIMIZADO: Comparte datos entre componentes
  getAll(): Observable<ApiResponse<EmployeeResponseDto[]>> {
    // Si ya hay datos en el BehaviorSubject y no está cargando, devolverlos
    const currentValue = this.employeesSubject.value;
    if (currentValue && !this.isLoading) {
      return of(currentValue);
    }
    
    // Si está cargando, devolver el observable compartido
    if (this.isLoading) {
      return this.employees$ as Observable<ApiResponse<EmployeeResponseDto[]>>;
    }
    
    // Si no hay datos, cargar desde caché o API
    this.isLoading = true;
    const observable = this.cacheService.getOrSet(
      this.CACHE_KEY_ALL,
      () => this.http.get<ApiResponse<EmployeeResponseDto[]>>(this.apiUrl),
      this.CACHE_EXPIRY
    ).pipe(
      tap(response => {
        this.employeesSubject.next(response);
        this.isLoading = false;
      }),
      shareReplay(1) // Compartir el resultado entre múltiples suscriptores
    );
    
    return observable;
  }
  
  // Método para forzar recarga (útil después de Create/Update/Delete)
  refreshEmployees(): void {
    this.cacheService.invalidate(this.CACHE_KEY_ALL);
    this.employeesSubject.next(null);
    this.isLoading = false;
  }

  // Obtener empleados paginados con filtros
  getPaged(filters: EmployeeFilters = {}): Observable<PagedResult<EmployeeResponseDto>> {
    let params = new HttpParams();
    
    if (filters.search) {
      params = params.set('search', filters.search);
    }
    if (filters.position) {
      params = params.set('position', filters.position);
    }
    if (filters.isAlsoClient !== undefined) {
      params = params.set('isAlsoClient', filters.isAlsoClient.toString());
    }
    if (filters.page) {
      params = params.set('page', filters.page.toString());
    }
    if (filters.pageSize) {
      params = params.set('pageSize', filters.pageSize.toString());
    }

    return this.http.get<PagedResult<EmployeeResponseDto>>(`${this.apiUrl}/paged`, { params });
  }

  // Obtener empleado por ID
  getById(id: number): Observable<EmployeeResponseDto> {
    return this.http.get<EmployeeResponseDto>(`${this.apiUrl}/${id}`);
  }

  // Crear nuevo empleado
  create(employee: EmployeeDto): Observable<EmployeeResponseDto> {
    return this.http.post<EmployeeResponseDto>(this.apiUrl, employee).pipe(
      tap(() => {
        this.cacheService.invalidate(this.CACHE_KEY_ALL);
        this.refreshEmployees();
      })
    );
  }

  // Actualizar empleado
  update(id: number, employee: EmployeeDto): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, employee).pipe(
      tap(() => {
        this.cacheService.invalidate(this.CACHE_KEY_ALL);
        this.refreshEmployees();
      })
    );
  }

  // Eliminar empleado (soft delete)
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.cacheService.invalidate(this.CACHE_KEY_ALL);
        this.refreshEmployees();
      })
    );
  }

  // Exportar empleados
  export(format: string = 'csv'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export?format=${format}`, {
      responseType: 'blob'
    });
  }
}
