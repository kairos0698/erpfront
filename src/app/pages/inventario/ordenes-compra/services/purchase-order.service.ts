import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { PurchaseOrderDto, PurchaseOrderResponseDto } from '../models/purchase-order.model';
import { ApiResponse } from '../../../../shared/models/api-response.model';

@Injectable({
    providedIn: 'root'
})
export class PurchaseOrderService {
    private apiUrl = `${environment.apiUrl}/PurchaseOrder`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<ApiResponse<PurchaseOrderResponseDto[]>> {
        return this.http.get<ApiResponse<PurchaseOrderResponseDto[]>>(this.apiUrl);
    }

    getById(id: number): Observable<ApiResponse<PurchaseOrderResponseDto>> {
        return this.http.get<ApiResponse<PurchaseOrderResponseDto>>(`${this.apiUrl}/${id}`);
    }

    create(order: PurchaseOrderDto): Observable<ApiResponse<PurchaseOrderResponseDto>> {
        return this.http.post<ApiResponse<PurchaseOrderResponseDto>>(this.apiUrl, order);
    }

    update(id: number, order: PurchaseOrderDto): Observable<ApiResponse<PurchaseOrderResponseDto>> {
        return this.http.put<ApiResponse<PurchaseOrderResponseDto>>(`${this.apiUrl}/${id}`, order);
    }

    delete(id: number): Observable<ApiResponse<object>> {
        return this.http.delete<ApiResponse<object>>(`${this.apiUrl}/${id}`);
    }

    approve(id: number): Observable<ApiResponse<PurchaseOrderResponseDto>> {
        return this.http.post<ApiResponse<PurchaseOrderResponseDto>>(`${this.apiUrl}/${id}/approve`, {});
    }

    cancel(id: number): Observable<ApiResponse<PurchaseOrderResponseDto>> {
        return this.http.post<ApiResponse<PurchaseOrderResponseDto>>(`${this.apiUrl}/${id}/cancel`, {});
    }
}
