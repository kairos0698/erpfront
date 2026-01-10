import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { ProductDto, ProductResponseDto } from '../models/product.model';
import { ApiResponse } from '../../../../shared/models/api-response.model';
import { CacheService } from '../../../../shared/services/cache.service';

@Injectable({
    providedIn: 'root'
})
export class ProductService {
    private apiUrl = `${environment.apiUrl}/Products`;
    private readonly CACHE_KEY_ALL = 'products:all';
    private readonly CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutos

    constructor(
        private http: HttpClient,
        private cacheService: CacheService
    ) { }

    getAll(): Observable<ApiResponse<ProductResponseDto[]>> {
        return this.cacheService.getOrSet(
            this.CACHE_KEY_ALL,
            () => this.http.get<ApiResponse<ProductResponseDto[]>>(this.apiUrl),
            this.CACHE_EXPIRY
        );
    }

    getById(id: number): Observable<ApiResponse<ProductResponseDto>> {
        return this.http.get<ApiResponse<ProductResponseDto>>(`${this.apiUrl}/${id}`);
    }

    create(product: ProductDto): Observable<ApiResponse<ProductResponseDto>> {
        console.log('Enviando producto al backend:', product);
        return this.http.post<ApiResponse<ProductResponseDto>>(this.apiUrl, product).pipe(
            tap(() => this.cacheService.invalidate(this.CACHE_KEY_ALL))
        );
    }

    update(id: number, product: ProductDto): Observable<ApiResponse<ProductResponseDto>> {
        return this.http.put<ApiResponse<ProductResponseDto>>(`${this.apiUrl}/${id}`, product).pipe(
            tap(() => this.cacheService.invalidate(this.CACHE_KEY_ALL))
        );
    }

    delete(id: number): Observable<ApiResponse<object>> {
        return this.http.delete<ApiResponse<object>>(`${this.apiUrl}/${id}`).pipe(
            tap(() => this.cacheService.invalidate(this.CACHE_KEY_ALL))
        );
    }
}
