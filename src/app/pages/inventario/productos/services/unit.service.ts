import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { CacheService } from '../../../../shared/services/cache.service';
import { ApiResponse } from '../../../../shared/models/api-response.model';
import { AuthService } from '../../../../auth.service';

export interface UnitResponseDto {
    id: number;
    name: string;
    abbreviation: string;
    isActive: boolean;
    organizationId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateUnitDto {
    name: string;
    abbreviation: string;
    isActive: boolean;
}

export interface UpdateUnitDto {
    id: number;
    name: string;
    abbreviation: string;
    isActive: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class UnitService {
    private apiUrl = `${environment.apiUrl}/Units`;
    private readonly CACHE_KEY_PREFIX = 'units:all';
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

    getAll(): Observable<UnitResponseDto[]> {
        const cacheKey = this.getCacheKey();
        
        // Intentar obtener del caché primero
        const cached = this.cacheService.get<UnitResponseDto[]>(cacheKey);
        if (cached !== null) {
            return of(cached);
        }
        
        // Si no está en caché, hacer la petición HTTP
        return this.http.get<UnitResponseDto[]>(this.apiUrl).pipe(
            map((data: any) => {
                // Asegurar que siempre devolvemos un array
                if (Array.isArray(data)) {
                    // Guardar en caché después de procesar
                    this.cacheService.set(cacheKey, data, this.CACHE_EXPIRY);
                    return data;
                }
                // Si viene envuelto en alguna estructura, intentar extraerlo
                if (data && Array.isArray(data.data)) {
                    const extracted = data.data;
                    this.cacheService.set(cacheKey, extracted, this.CACHE_EXPIRY);
                    return extracted;
                }
                console.warn('UnitService: Unexpected format:', data);
                return [];
            }),
            tap({
                next: (data) => {
                    console.log('UnitService: Loaded', data?.length || 0, 'units for organization');
                },
                error: (error) => {
                    console.error('UnitService: Error fetching units from API:', error);
                }
            })
        );
    }

    getById(id: number): Observable<UnitResponseDto> {
        return this.http.get<UnitResponseDto>(`${this.apiUrl}/${id}`);
    }

    create(unit: CreateUnitDto): Observable<UnitResponseDto> {
        const cacheKey = this.getCacheKey();
        return this.http.post<ApiResponse<UnitResponseDto>>(this.apiUrl, unit).pipe(
            tap(() => this.cacheService.invalidate(cacheKey)),
            map(response => response.success && response.data ? response.data : response as any)
        );
    }

    update(id: number, unit: UpdateUnitDto): Observable<UnitResponseDto> {
        const cacheKey = this.getCacheKey();
        return this.http.put<ApiResponse<UnitResponseDto>>(`${this.apiUrl}/${id}`, unit).pipe(
            tap(() => this.cacheService.invalidate(cacheKey)),
            map(response => response.success && response.data ? response.data : response as any)
        );
    }

    delete(id: number): Observable<void> {
        const cacheKey = this.getCacheKey();
        return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
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
}
