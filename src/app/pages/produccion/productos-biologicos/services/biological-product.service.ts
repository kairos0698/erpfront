import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { BiologicalProductDto, BiologicalProductResponseDto, BiologicalProductFilters, ProductType } from '../models/biological-product.model';
import { ApiResponse } from '../../../../shared/models/api-response.model';

@Injectable({
    providedIn: 'root'
})
export class BiologicalProductService {
    private apiUrl = `${environment.apiUrl}/Products`;

    constructor(private http: HttpClient) { }

    getAll(filters?: BiologicalProductFilters): Observable<ApiResponse<BiologicalProductResponseDto[]>> {
        let params = new HttpParams();
        if (filters) {
            if (filters.search) params = params.set('search', filters.search);
            if (filters.isActive !== undefined) params = params.set('isActive', filters.isActive.toString());
        }
        
        return this.http.get<ApiResponse<BiologicalProductResponseDto[]>>(this.apiUrl, { params }).pipe(
            map(response => ({
                ...response,
                data: response.data?.filter(product => product.type === ProductType.BiologicalProduct) || []
            }))
        );
    }

    getById(id: number): Observable<ApiResponse<BiologicalProductResponseDto>> {
        return this.http.get<ApiResponse<BiologicalProductResponseDto>>(`${this.apiUrl}/${id}`);
    }

    create(dto: BiologicalProductDto): Observable<ApiResponse<BiologicalProductResponseDto>> {
        return this.http.post<ApiResponse<BiologicalProductResponseDto>>(this.apiUrl, dto);
    }

    update(id: number, dto: BiologicalProductDto): Observable<ApiResponse<BiologicalProductResponseDto>> {
        return this.http.put<ApiResponse<BiologicalProductResponseDto>>(`${this.apiUrl}/${id}`, dto);
    }

    delete(id: number): Observable<ApiResponse<object>> {
        return this.http.delete<ApiResponse<object>>(`${this.apiUrl}/${id}`);
    }

    export(format: 'csv' | 'pdf'): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/export/${format}`, { params: { type: ProductType.BiologicalProduct.toString() }, responseType: 'blob' });
    }
}
