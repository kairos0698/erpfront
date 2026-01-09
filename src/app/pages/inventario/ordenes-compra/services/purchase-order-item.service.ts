import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { PurchaseOrderItemDto, PurchaseOrderItemResponseDto } from '../models/purchase-order-item.model';
import { ApiResponse } from '../../../../shared/models/api-response.model';

@Injectable({
    providedIn: 'root'
})
export class PurchaseOrderItemService {
    private apiUrl = `${environment.apiUrl}/PurchaseOrderItem`;

    constructor(private http: HttpClient) { }

    getByPurchaseOrderId(purchaseOrderId: number): Observable<ApiResponse<PurchaseOrderItemResponseDto[]>> {
        return this.http.get<ApiResponse<PurchaseOrderItemResponseDto[]>>(`${this.apiUrl}/purchase-order/${purchaseOrderId}`);
    }

    getById(id: number): Observable<ApiResponse<PurchaseOrderItemResponseDto>> {
        return this.http.get<ApiResponse<PurchaseOrderItemResponseDto>>(`${this.apiUrl}/${id}`);
    }

    create(item: PurchaseOrderItemDto): Observable<ApiResponse<PurchaseOrderItemResponseDto>> {
        return this.http.post<ApiResponse<PurchaseOrderItemResponseDto>>(this.apiUrl, item);
    }

    update(id: number, item: PurchaseOrderItemDto): Observable<ApiResponse<PurchaseOrderItemResponseDto>> {
        return this.http.put<ApiResponse<PurchaseOrderItemResponseDto>>(`${this.apiUrl}/${id}`, item);
    }

    delete(id: number): Observable<ApiResponse<object>> {
        return this.http.delete<ApiResponse<object>>(`${this.apiUrl}/${id}`);
    }
}
