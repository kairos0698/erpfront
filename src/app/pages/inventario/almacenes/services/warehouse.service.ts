import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { WarehouseDto, WarehouseResponseDto } from '../models/warehouse.model';
import { ApiResponse } from '../../../../shared/models/api-response.model';
import { CacheService } from '../../../../shared/services/cache.service';

@Injectable({
    providedIn: 'root'
})
export class WarehouseService {
    private apiUrl = `${environment.apiUrl}/Warehouses`;
    private readonly CACHE_KEY_ALL = 'warehouses:all';
    private readonly CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutos

    constructor(
        private http: HttpClient,
        private cacheService: CacheService
    ) { }

    getAll(): Observable<ApiResponse<WarehouseResponseDto[]>> {
        return this.cacheService.getOrSet(
            this.CACHE_KEY_ALL,
            () => this.http.get<ApiResponse<WarehouseResponseDto[]>>(this.apiUrl),
            this.CACHE_EXPIRY
        );
    }

    getById(id: number): Observable<ApiResponse<WarehouseResponseDto>> {
        return this.http.get<ApiResponse<WarehouseResponseDto>>(`${this.apiUrl}/${id}`);
    }

    create(warehouse: WarehouseDto): Observable<ApiResponse<WarehouseResponseDto>> {
        return this.http.post<ApiResponse<WarehouseResponseDto>>(this.apiUrl, warehouse).pipe(
            tap(() => this.cacheService.invalidate(this.CACHE_KEY_ALL))
        );
    }

    update(id: number, warehouse: WarehouseDto): Observable<ApiResponse<WarehouseResponseDto>> {
        return this.http.put<ApiResponse<WarehouseResponseDto>>(`${this.apiUrl}/${id}`, warehouse).pipe(
            tap(() => this.cacheService.invalidate(this.CACHE_KEY_ALL))
        );
    }

    delete(id: number): Observable<ApiResponse<object>> {
        return this.http.delete<ApiResponse<object>>(`${this.apiUrl}/${id}`).pipe(
            tap(() => this.cacheService.invalidate(this.CACHE_KEY_ALL))
        );
    }

    export(format: string): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/export?format=${format}`, {
            responseType: 'blob'
        });
    }
}
