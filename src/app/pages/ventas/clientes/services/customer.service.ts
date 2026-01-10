import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { CustomerDto, CustomerResponseDto } from '../models/customer.model';
import { ApiResponse } from '../../../../shared/models/api-response.model';
import { CacheService } from '../../../../shared/services/cache.service';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private apiUrl = `${environment.apiUrl}/SalesCustomer`;
  private readonly CACHE_KEY_ALL = 'customers:all';
  private readonly CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutos

  constructor(
    private http: HttpClient,
    private cacheService: CacheService
  ) {}

  getAll(): Observable<ApiResponse<CustomerResponseDto[]>> {
    return this.cacheService.getOrSet(
      this.CACHE_KEY_ALL,
      () => this.http.get<ApiResponse<CustomerResponseDto[]>>(this.apiUrl),
      this.CACHE_EXPIRY
    );
  }

  getById(id: number): Observable<ApiResponse<CustomerResponseDto>> {
    return this.http.get<ApiResponse<CustomerResponseDto>>(`${this.apiUrl}/${id}`);
  }

  create(customer: CustomerDto): Observable<ApiResponse<CustomerResponseDto>> {
    return this.http.post<ApiResponse<CustomerResponseDto>>(this.apiUrl, customer).pipe(
      tap(() => this.cacheService.invalidate(this.CACHE_KEY_ALL))
    );
  }

  update(id: number, customer: CustomerDto): Observable<ApiResponse<CustomerResponseDto>> {
    return this.http.put<ApiResponse<CustomerResponseDto>>(`${this.apiUrl}/${id}`, customer).pipe(
      tap(() => this.cacheService.invalidate(this.CACHE_KEY_ALL))
    );
  }

  delete(id: number): Observable<ApiResponse<object>> {
    return this.http.delete<ApiResponse<object>>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.cacheService.invalidate(this.CACHE_KEY_ALL))
    );
  }
}

