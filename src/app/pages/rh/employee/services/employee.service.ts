import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { EmployeeDto, EmployeeResponseDto, PagedResult, EmployeeFilters } from '../models/employee.model';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = `${environment.apiUrl}/Employees`;

  constructor(private http: HttpClient) {}

  // Obtener todos los empleados
  getAll(): Observable<EmployeeResponseDto[]> {
    return this.http.get<EmployeeResponseDto[]>(this.apiUrl);
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
    return this.http.post<EmployeeResponseDto>(this.apiUrl, employee);
  }

  // Actualizar empleado
  update(id: number, employee: EmployeeDto): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, employee);
  }

  // Eliminar empleado (soft delete)
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Exportar empleados
  export(format: string = 'csv'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export?format=${format}`, {
      responseType: 'blob'
    });
  }
}
