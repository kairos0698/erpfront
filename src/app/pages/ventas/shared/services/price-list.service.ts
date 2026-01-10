import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { PriceListDto, PriceListResponseDto } from '../models/price-list.model';
import { ApiResponse } from '../../../../shared/models/api-response.model';
import { CacheService } from '../../../../shared/services/cache.service';

@Injectable({
  providedIn: 'root'
})
export class PriceListService {
  private apiUrl = `${environment.apiUrl}/PriceList`;
  private readonly CACHE_KEY_ALL = 'pricelists:all';
  private readonly CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutos

  constructor(
    private http: HttpClient,
    private cacheService: CacheService
  ) {}

  getAll(): Observable<ApiResponse<PriceListResponseDto[]>> {
    return this.cacheService.getOrSet(
      this.CACHE_KEY_ALL,
      () => this.http.get<ApiResponse<PriceListResponseDto[]>>(this.apiUrl),
      this.CACHE_EXPIRY
    );
  }

  getById(id: number): Observable<ApiResponse<PriceListResponseDto>> {
    return this.http.get<ApiResponse<PriceListResponseDto>>(`${this.apiUrl}/${id}`);
  }

  create(priceList: PriceListDto): Observable<ApiResponse<PriceListResponseDto>> {
    return this.http.post<ApiResponse<PriceListResponseDto>>(this.apiUrl, priceList).pipe(
      tap(() => this.cacheService.invalidate(this.CACHE_KEY_ALL))
    );
  }

  update(id: number, priceList: PriceListDto): Observable<ApiResponse<PriceListResponseDto>> {
    return this.http.put<ApiResponse<PriceListResponseDto>>(`${this.apiUrl}/${id}`, priceList).pipe(
      tap(() => this.cacheService.invalidate(this.CACHE_KEY_ALL))
    );
  }

  delete(id: number): Observable<ApiResponse<object>> {
    return this.http.delete<ApiResponse<object>>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.cacheService.invalidate(this.CACHE_KEY_ALL))
    );
  }
}

