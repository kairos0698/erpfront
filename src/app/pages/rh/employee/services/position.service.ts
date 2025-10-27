import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { PositionDto, PositionResponseDto, PositionFilters } from '../models/position.model';
import { ApiResponse } from '../../../../shared/models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class PositionService {
  private apiUrl = `${environment.apiUrl}/Positions`;
  private http = inject(HttpClient);

  getAll(): Observable<ApiResponse<PositionResponseDto[]>> {
    return this.http.get<ApiResponse<PositionResponseDto[]>>(this.apiUrl);
  }

  getById(id: number): Observable<ApiResponse<PositionResponseDto>> {
    return this.http.get<ApiResponse<PositionResponseDto>>(`${this.apiUrl}/${id}`);
  }

  create(position: PositionDto): Observable<ApiResponse<PositionResponseDto>> {
    return this.http.post<ApiResponse<PositionResponseDto>>(this.apiUrl, position);
  }

  update(id: number, position: PositionDto): Observable<ApiResponse<PositionResponseDto>> {
    return this.http.put<ApiResponse<PositionResponseDto>>(`${this.apiUrl}/${id}`, position);
  }

  delete(id: number): Observable<ApiResponse<object>> {
    return this.http.delete<ApiResponse<object>>(`${this.apiUrl}/${id}`);
  }
}
