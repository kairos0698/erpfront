import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ApiResponse } from '../../../../shared/models/api-response.model';
import { CacheService } from '../../../../shared/services/cache.service';

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
    private readonly CACHE_KEY_WAREHOUSES = 'reference:warehouses';
    private readonly CACHE_KEY_CLASSIFICATIONS = 'reference:classifications';
    private readonly CACHE_KEY_UNITS = 'reference:units';
    private readonly CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutos

    constructor(
        private http: HttpClient,
        private cacheService: CacheService
    ) { }

    getWarehouses(): Observable<ApiResponse<WarehouseResponseDto[]>> {
        // Nota: getWarehouses ya está optimizado en WarehouseService, pero mantenemos compatibilidad
        return this.cacheService.getOrSet(
            this.CACHE_KEY_WAREHOUSES,
            () => this.http.get<ApiResponse<WarehouseResponseDto[]>>(`${environment.apiUrl}/Warehouses`),
            this.CACHE_EXPIRY
        );
    }

    getProductClassifications(): Observable<ApiResponse<ProductClassificationResponseDto[]>> {
        return this.cacheService.getOrSet(
            this.CACHE_KEY_CLASSIFICATIONS,
            () => this.http.get<ApiResponse<ProductClassificationResponseDto[]>>(`${environment.apiUrl}/ProductClassifications`),
            this.CACHE_EXPIRY
        );
    }

    getUnits(): Observable<ApiResponse<UnitResponseDto[]>> {
        return this.cacheService.getOrSet(
            this.CACHE_KEY_UNITS,
            () => this.http.get<ApiResponse<UnitResponseDto[]>>(`${environment.apiUrl}/Units`),
            this.CACHE_EXPIRY
        );
    }

    // Método para invalidar caché cuando se crea/actualiza/elimina un registro
    invalidateCache(type: 'warehouses' | 'classifications' | 'units' | 'all'): void {
        switch (type) {
            case 'warehouses':
                this.cacheService.invalidate(this.CACHE_KEY_WAREHOUSES);
                break;
            case 'classifications':
                this.cacheService.invalidate(this.CACHE_KEY_CLASSIFICATIONS);
                break;
            case 'units':
                this.cacheService.invalidate(this.CACHE_KEY_UNITS);
                break;
            case 'all':
                this.cacheService.invalidate(this.CACHE_KEY_WAREHOUSES);
                this.cacheService.invalidate(this.CACHE_KEY_CLASSIFICATIONS);
                this.cacheService.invalidate(this.CACHE_KEY_UNITS);
                break;
        }
    }
}
