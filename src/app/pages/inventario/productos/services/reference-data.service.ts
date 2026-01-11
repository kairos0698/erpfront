import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { ApiResponse } from '../../../../shared/models/api-response.model';
import { CacheService } from '../../../../shared/services/cache.service';
import { AuthService } from '../../../../auth.service';

export interface WarehouseResponseDto {
    id: number;
    name: string;
    abbreviation?: string;
    isActive: boolean;
    organizationId: string;
    createdAt: string;
    updatedAt: string;
}

export interface ProductClassificationResponseDto {
    id: number;
    name: string;
    description?: string;
    isActive: boolean;
    organizationId: string;
    createdAt: string;
    updatedAt: string;
}

export interface UnitResponseDto {
    id: number;
    name: string;
    abbreviation: string;
    isActive: boolean;
    organizationId: string;
    createdAt: string;
    updatedAt: string;
}

@Injectable({
    providedIn: 'root'
})
export class ReferenceDataService {
    private readonly CACHE_KEY_PREFIX_WAREHOUSES = 'reference:warehouses';
    private readonly CACHE_KEY_PREFIX_CLASSIFICATIONS = 'reference:classifications';
    private readonly CACHE_KEY_PREFIX_UNITS = 'reference:units';
    private readonly CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutos

    constructor(
        private http: HttpClient,
        private cacheService: CacheService,
        private authService: AuthService
    ) { }

    /**
     * Obtiene la clave de caché específica para la organización del usuario actual
     */
    private getCacheKey(prefix: string): string {
        const currentUser = this.authService.getCurrentUser();
        const organizationId = currentUser?.organizationId || 'unknown';
        return `${prefix}:${organizationId}`;
    }

    getWarehouses(): Observable<ApiResponse<WarehouseResponseDto[]>> {
        const cacheKey = this.getCacheKey(this.CACHE_KEY_PREFIX_WAREHOUSES);
        
        // Intentar obtener del caché primero
        const cached = this.cacheService.get<ApiResponse<WarehouseResponseDto[]>>(cacheKey);
        if (cached !== null) {
            return of(cached);
        }
        
        // Si no está en caché, hacer la petición HTTP
        return this.http.get<ApiResponse<WarehouseResponseDto[]>>(`${environment.apiUrl}/Warehouses`).pipe(
            tap((data: ApiResponse<WarehouseResponseDto[]>) => {
                // Guardar en caché después de procesar
                this.cacheService.set(cacheKey, data, this.CACHE_EXPIRY);
            })
        );
    }

    getProductClassifications(): Observable<ApiResponse<ProductClassificationResponseDto[]>> {
        const cacheKey = this.getCacheKey(this.CACHE_KEY_PREFIX_CLASSIFICATIONS);
        
        // Intentar obtener del caché primero
        const cached = this.cacheService.get<ApiResponse<ProductClassificationResponseDto[]>>(cacheKey);
        if (cached !== null) {
            return of(cached);
        }
        
        // Si no está en caché, hacer la petición HTTP
        return this.http.get<ApiResponse<ProductClassificationResponseDto[]>>(`${environment.apiUrl}/ProductClassifications`).pipe(
            tap((data: ApiResponse<ProductClassificationResponseDto[]>) => {
                // Guardar en caché después de procesar
                this.cacheService.set(cacheKey, data, this.CACHE_EXPIRY);
            })
        );
    }

    getUnits(): Observable<ApiResponse<UnitResponseDto[]>> {
        const cacheKey = this.getCacheKey(this.CACHE_KEY_PREFIX_UNITS);
        
        // Intentar obtener del caché primero
        const cached = this.cacheService.get<ApiResponse<UnitResponseDto[]>>(cacheKey);
        if (cached !== null) {
            return of(cached);
        }
        
        // Si no está en caché, hacer la petición HTTP
        return this.http.get<ApiResponse<UnitResponseDto[]>>(`${environment.apiUrl}/Units`).pipe(
            tap((data: ApiResponse<UnitResponseDto[]>) => {
                // Guardar en caché después de procesar
                this.cacheService.set(cacheKey, data, this.CACHE_EXPIRY);
            })
        );
    }

    // Método para invalidar caché cuando se crea/actualiza/elimina un registro
    invalidateCache(type: 'warehouses' | 'classifications' | 'units' | 'all'): void {
        switch (type) {
            case 'warehouses':
                this.cacheService.invalidateByPrefix(this.CACHE_KEY_PREFIX_WAREHOUSES);
                break;
            case 'classifications':
                this.cacheService.invalidateByPrefix(this.CACHE_KEY_PREFIX_CLASSIFICATIONS);
                break;
            case 'units':
                this.cacheService.invalidateByPrefix(this.CACHE_KEY_PREFIX_UNITS);
                break;
            case 'all':
                this.cacheService.invalidateByPrefix(this.CACHE_KEY_PREFIX_WAREHOUSES);
                this.cacheService.invalidateByPrefix(this.CACHE_KEY_PREFIX_CLASSIFICATIONS);
                this.cacheService.invalidateByPrefix(this.CACHE_KEY_PREFIX_UNITS);
                break;
        }
    }
}
