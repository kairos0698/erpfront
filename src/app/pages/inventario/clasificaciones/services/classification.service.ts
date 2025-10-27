import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ProductClassificationDto, ProductClassificationResponseDto } from '../models/classification.model';
import { ApiResponse } from '../../../../shared/models/api-response.model';

@Injectable({
    providedIn: 'root'
})
export class ClassificationService {
    private apiUrl = `${environment.apiUrl}/ProductClassifications`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<ApiResponse<ProductClassificationResponseDto[]>> {
        return this.http.get<ApiResponse<ProductClassificationResponseDto[]>>(this.apiUrl);
    }

    getById(id: number): Observable<ApiResponse<ProductClassificationResponseDto>> {
        return this.http.get<ApiResponse<ProductClassificationResponseDto>>(`${this.apiUrl}/${id}`);
    }

    create(classification: ProductClassificationDto): Observable<ApiResponse<ProductClassificationResponseDto>> {
        return this.http.post<ApiResponse<ProductClassificationResponseDto>>(this.apiUrl, classification);
    }

    update(id: number, classification: ProductClassificationDto): Observable<ApiResponse<ProductClassificationResponseDto>> {
        return this.http.put<ApiResponse<ProductClassificationResponseDto>>(`${this.apiUrl}/${id}`, classification);
    }

    delete(id: number): Observable<ApiResponse<object>> {
        return this.http.delete<ApiResponse<object>>(`${this.apiUrl}/${id}`);
    }
}
