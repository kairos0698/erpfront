import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { EmployeeTypeDto, EmployeeTypeResponseDto, EmployeeTypeFilters } from '../models/employee-type.model';
import { ApiResponse } from '../../../../shared/models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class EmployeeTypeService {
  private apiUrl = `${environment.apiUrl}/EmployeeTypes`;
  private http = inject(HttpClient);

  getAll(): Observable<ApiResponse<EmployeeTypeResponseDto[]>> {
    return this.http.get<ApiResponse<EmployeeTypeResponseDto[]>>(this.apiUrl);
  }

  getById(id: number): Observable<ApiResponse<EmployeeTypeResponseDto>> {
    return this.http.get<ApiResponse<EmployeeTypeResponseDto>>(`${this.apiUrl}/${id}`);
  }

  create(employeeType: EmployeeTypeDto): Observable<ApiResponse<EmployeeTypeResponseDto>> {
    return this.http.post<ApiResponse<EmployeeTypeResponseDto>>(this.apiUrl, employeeType);
  }

  update(id: number, employeeType: EmployeeTypeDto): Observable<ApiResponse<EmployeeTypeResponseDto>> {
    return this.http.put<ApiResponse<EmployeeTypeResponseDto>>(`${this.apiUrl}/${id}`, employeeType);
  }

  delete(id: number): Observable<ApiResponse<object>> {
    return this.http.delete<ApiResponse<object>>(`${this.apiUrl}/${id}`);
  }
}
