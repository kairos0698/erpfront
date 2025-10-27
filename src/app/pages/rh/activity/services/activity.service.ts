import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ActivityDto, ActivityResponseDto, PagedResult, ActivityFilters } from '../models/activity.model';
import { ApiResponse } from '../../../../shared/models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  private apiUrl = `${environment.apiUrl}/Activities`;
  private http = inject(HttpClient);

  getAll(): Observable<ApiResponse<ActivityResponseDto[]>> {
    return this.http.get<ApiResponse<ActivityResponseDto[]>>(this.apiUrl);
  }

  getPaged(filters: ActivityFilters): Observable<PagedResult<ActivityResponseDto>> {
    let params = new HttpParams();
    if (filters.search) params = params.append('search', filters.search);
    if (filters.isActive !== undefined) params = params.append('isActive', filters.isActive.toString());
    if (filters.page) params = params.append('page', filters.page.toString());
    if (filters.pageSize) params = params.append('pageSize', filters.pageSize.toString());

    return this.http.get<PagedResult<ActivityResponseDto>>(`${this.apiUrl}/paged`, { params });
  }

  getById(id: number): Observable<ActivityResponseDto> {
    return this.http.get<ActivityResponseDto>(`${this.apiUrl}/${id}`);
  }

  create(activity: ActivityDto): Observable<ActivityResponseDto> {
    return this.http.post<ActivityResponseDto>(this.apiUrl, activity);
  }

  update(id: number, activity: ActivityDto): Observable<ActivityResponseDto> {
    return this.http.put<ActivityResponseDto>(`${this.apiUrl}/${id}`, activity);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  export(format: string = 'csv'): Observable<Blob> {
    let params = new HttpParams().append('format', format);
    return this.http.get(`${this.apiUrl}/export`, { params, responseType: 'blob' });
  }
}
