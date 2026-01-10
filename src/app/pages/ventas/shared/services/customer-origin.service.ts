import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { CustomerOriginDto, CustomerOriginResponseDto } from '../models/customer-origin.model';
import { ApiResponse } from '../../../../shared/models/api-response.model';
import { CacheService } from '../../../../shared/services/cache.service';

@Injectable({
  providedIn: 'root'
})
export class CustomerOriginService {
  private apiUrl = `${environment.apiUrl}/CustomerOrigin`;
  private readonly CACHE_KEY_ALL = 'customerorigins:all';
  private readonly CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutos

  constructor(
    private http: HttpClient,
    private cacheService: CacheService
  ) {}

  getAll(): Observable<ApiResponse<CustomerOriginResponseDto[]>> {
    return this.cacheService.getOrSet(
      this.CACHE_KEY_ALL,
      () => this.http.get<ApiResponse<CustomerOriginResponseDto[]>>(this.apiUrl),
      this.CACHE_EXPIRY
    );
  }

  getById(id: number): Observable<ApiResponse<CustomerOriginResponseDto>> {
    return this.http.get<ApiResponse<CustomerOriginResponseDto>>(`${this.apiUrl}/${id}`);
  }

  create(customerOrigin: CustomerOriginDto): Observable<ApiResponse<CustomerOriginResponseDto>> {
    return this.http.post<ApiResponse<CustomerOriginResponseDto>>(this.apiUrl, customerOrigin).pipe(
      tap(() => this.cacheService.invalidate(this.CACHE_KEY_ALL))
    );
  }

  update(id: number, customerOrigin: CustomerOriginDto): Observable<ApiResponse<CustomerOriginResponseDto>> {
    return this.http.put<ApiResponse<CustomerOriginResponseDto>>(`${this.apiUrl}/${id}`, customerOrigin).pipe(
      tap(() => this.cacheService.invalidate(this.CACHE_KEY_ALL))
    );
  }

  delete(id: number): Observable<ApiResponse<object>> {
    return this.http.delete<ApiResponse<object>>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.cacheService.invalidate(this.CACHE_KEY_ALL))
    );
  }
}

