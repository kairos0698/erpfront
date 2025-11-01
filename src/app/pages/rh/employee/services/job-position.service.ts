import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface JobPositionDto {
  id: number;
  name: string;
  description?: string;
  areaId: number;
  hierarchicalLevelId: number;
  contractTypeId: number;
  workShiftId: number;
  laborRiskId: number;
  shiftId: number;
  paymentPeriodId: number;
  paymentUnitId: number;
  baseSalary?: number;
  isActive: boolean;
  // Campos relacionados
  areaName?: string;
  hierarchicalLevelName?: string;
  contractTypeName?: string;
  workShiftName?: string;
  laborRiskName?: string;
  shiftName?: string;
  paymentPeriodName?: string;
  paymentUnitName?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class JobPositionService {
  private apiUrl = `${environment.apiUrl}/JobPositions`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<JobPositionDto[]>> {
    return this.http.get<ApiResponse<JobPositionDto[]>>(this.apiUrl);
  }

  getById(id: number): Observable<ApiResponse<JobPositionDto>> {
    return this.http.get<ApiResponse<JobPositionDto>>(`${this.apiUrl}/${id}`);
  }

  create(jobPosition: Partial<JobPositionDto>): Observable<ApiResponse<JobPositionDto>> {
    return this.http.post<ApiResponse<JobPositionDto>>(this.apiUrl, jobPosition);
  }

  update(id: number, jobPosition: Partial<JobPositionDto>): Observable<ApiResponse<JobPositionDto>> {
    return this.http.put<ApiResponse<JobPositionDto>>(`${this.apiUrl}/${id}`, jobPosition);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
