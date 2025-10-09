import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { EmployeeTypeDto, EmployeeTypeResponseDto, EmployeeTypeFilters } from '../models/employee-type.model';

@Injectable({
  providedIn: 'root'
})
export class EmployeeTypeService {
  private apiUrl = `${environment.apiUrl}/EmployeeTypes`;
  private http = inject(HttpClient);

  getAll(): Observable<EmployeeTypeResponseDto[]> {
    return this.http.get<EmployeeTypeResponseDto[]>(this.apiUrl);
  }

  getById(id: number): Observable<EmployeeTypeResponseDto> {
    return this.http.get<EmployeeTypeResponseDto>(`${this.apiUrl}/${id}`);
  }

  create(employeeType: EmployeeTypeDto): Observable<EmployeeTypeResponseDto> {
    return this.http.post<EmployeeTypeResponseDto>(this.apiUrl, employeeType);
  }

  update(id: number, employeeType: EmployeeTypeDto): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, employeeType);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
