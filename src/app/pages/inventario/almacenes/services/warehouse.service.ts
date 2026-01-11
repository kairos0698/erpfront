import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { WarehouseDto, WarehouseResponseDto } from '../models/warehouse.model';
import { ApiResponse } from '../../../../shared/models/api-response.model';
import { CacheService } from '../../../../shared/services/cache.service';
import { AuthService } from '../../../../auth.service';

@Injectable({
    providedIn: 'root'
})
export class WarehouseService {
    private apiUrl = `${environment.apiUrl}/Warehouses`;
    private readonly CACHE_KEY_PREFIX = 'warehouses:all';
    private readonly CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutos

    constructor(
        private http: HttpClient,
        private cacheService: CacheService,
        private authService: AuthService
    ) { }

    /**
     * Obtiene la clave de caché específica para la organización del usuario actual
     */
    private getCacheKey(): string {
        const currentUser = this.authService.getCurrentUser();
        const organizationId = currentUser?.organizationId || 'unknown';
        return `${this.CACHE_KEY_PREFIX}:${organizationId}`;
    }

    /**
     * Invalida el caché de todas las organizaciones (útil al cambiar de usuario)
     */
    invalidateAllCache(): void {
        this.cacheService.invalidateByPrefix(this.CACHE_KEY_PREFIX);
    }

    getAll(): Observable<ApiResponse<WarehouseResponseDto[]>> {
        const cacheKey = this.getCacheKey();
        
        // Intentar obtener del caché primero
        const cached = this.cacheService.get<ApiResponse<WarehouseResponseDto[]>>(cacheKey);
        if (cached !== null) {
            return of(cached);
        }
        
        // Si no está en caché, hacer la petición HTTP
        return this.http.get<ApiResponse<WarehouseResponseDto[]>>(this.apiUrl).pipe(
            tap(data => {
                // Guardar en caché después de procesar
                this.cacheService.set(cacheKey, data, this.CACHE_EXPIRY);
            })
        );
    }

    getById(id: number): Observable<ApiResponse<WarehouseResponseDto>> {
        return this.http.get<ApiResponse<WarehouseResponseDto>>(`${this.apiUrl}/${id}`);
    }

    create(warehouse: WarehouseDto): Observable<ApiResponse<WarehouseResponseDto>> {
        const cacheKey = this.getCacheKey();
        return this.http.post<ApiResponse<WarehouseResponseDto>>(this.apiUrl, warehouse).pipe(
            tap(() => this.cacheService.invalidate(cacheKey))
        );
    }

    update(id: number, warehouse: WarehouseDto): Observable<ApiResponse<WarehouseResponseDto>> {
        const cacheKey = this.getCacheKey();
        return this.http.put<ApiResponse<WarehouseResponseDto>>(`${this.apiUrl}/${id}`, warehouse).pipe(
            tap(() => this.cacheService.invalidate(cacheKey))
        );
    }

    delete(id: number): Observable<ApiResponse<object>> {
        const cacheKey = this.getCacheKey();
        return this.http.delete<ApiResponse<object>>(`${this.apiUrl}/${id}`).pipe(
            tap(() => this.cacheService.invalidate(cacheKey))
        );
    }

    /**
     * Invalida el caché de la organización actual
     */
    invalidateCache(): void {
        const cacheKey = this.getCacheKey();
        this.cacheService.invalidate(cacheKey);
    }

    export(format: string): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/export?format=${format}`, {
            responseType: 'blob'
        });
    }
}
