import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { ApiResponse } from '../../../../shared/models/api-response.model';
import { RegionStatusDto, CreateRegionStatusDto, UpdateRegionStatusDto } from '../models/region-lot.model';

@Injectable({
  providedIn: 'root'
})
export class RegionStatusService {
  private apiUrl = `${environment.apiUrl}/RegionStatuses`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<RegionStatusDto[]> {
    return this.http.get<ApiResponse<RegionStatusDto[]>>(this.apiUrl).pipe(
      map((response) => {
        if (response.success && response.data) {
          return Array.isArray(response.data) ? response.data : [];
        }
        return [];
      })
    );
  }

  getById(id: number): Observable<RegionStatusDto> {
    return this.http.get<ApiResponse<RegionStatusDto>>(`${this.apiUrl}/${id}`).pipe(
      map((response) => response.data!)
    );
  }

  create(status: CreateRegionStatusDto): Observable<RegionStatusDto> {
    return this.http.post<ApiResponse<RegionStatusDto>>(this.apiUrl, status).pipe(
      map((response) => response.data!)
    );
  }

  update(id: number, status: UpdateRegionStatusDto): Observable<RegionStatusDto> {
    return this.http.put<ApiResponse<RegionStatusDto>>(`${this.apiUrl}/${id}`, status).pipe(
      map((response) => response.data!)
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<ApiResponse<object>>(`${this.apiUrl}/${id}`).pipe(
      map(() => void 0)
    );
  }
}

