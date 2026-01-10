import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { SupplierDto, SupplierResponseDto } from '../models/supplier.model';
import { ApiResponse } from '../../../../shared/models/api-response.model';
import { CacheService } from '../../../../shared/services/cache.service';

@Injectable({
    providedIn: 'root'
})
export class SupplierService {
    private apiUrl = `${environment.apiUrl}/Suppliers`;
    private readonly CACHE_KEY_ALL = 'suppliers:all';
    private readonly CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutos

    constructor(
        private http: HttpClient,
        private cacheService: CacheService
    ) { }

    getAll(): Observable<ApiResponse<SupplierResponseDto[]>> {
        return this.cacheService.getOrSet(
            this.CACHE_KEY_ALL,
            () => this.http.get<ApiResponse<SupplierResponseDto[]>>(this.apiUrl),
            this.CACHE_EXPIRY
        );
    }

    getById(id: number): Observable<ApiResponse<SupplierResponseDto>> {
        return this.http.get<ApiResponse<SupplierResponseDto>>(`${this.apiUrl}/${id}`);
    }

    create(supplier: SupplierDto): Observable<ApiResponse<SupplierResponseDto>> {
        return this.http.post<ApiResponse<SupplierResponseDto>>(this.apiUrl, supplier);
    }

    update(id: number, supplier: SupplierDto): Observable<ApiResponse<SupplierResponseDto>> {
        return this.http.put<ApiResponse<SupplierResponseDto>>(`${this.apiUrl}/${id}`, supplier);
    }

    delete(id: number): Observable<ApiResponse<object>> {
        return this.http.delete<ApiResponse<object>>(`${this.apiUrl}/${id}`);
    }
}
