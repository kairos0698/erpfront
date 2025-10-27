import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ProductDto, ProductResponseDto } from '../models/product.model';
import { ApiResponse } from '../../../../shared/models/api-response.model';

@Injectable({
    providedIn: 'root'
})
export class ProductService {
    private apiUrl = `${environment.apiUrl}/Products`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<ApiResponse<ProductResponseDto[]>> {
        return this.http.get<ApiResponse<ProductResponseDto[]>>(this.apiUrl);
    }

    getById(id: number): Observable<ApiResponse<ProductResponseDto>> {
        return this.http.get<ApiResponse<ProductResponseDto>>(`${this.apiUrl}/${id}`);
    }

    create(product: ProductDto): Observable<ApiResponse<ProductResponseDto>> {
        console.log('Enviando producto al backend:', product);
        return this.http.post<ApiResponse<ProductResponseDto>>(this.apiUrl, product);
    }

    update(id: number, product: ProductDto): Observable<ApiResponse<ProductResponseDto>> {
        return this.http.put<ApiResponse<ProductResponseDto>>(`${this.apiUrl}/${id}`, product);
    }

    delete(id: number): Observable<ApiResponse<object>> {
        return this.http.delete<ApiResponse<object>>(`${this.apiUrl}/${id}`);
    }
}
