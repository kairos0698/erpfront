import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ApiResponse } from '../../../../shared/models/api-response.model';

export interface InventoryReportFilter {
    productId?: number;
    warehouseId?: number;
    classificationId?: number;
}

export interface InventoryReportItem {
    id: number;
    name: string;
    sku?: string;
    description?: string;
    type: string;
    classificationName?: string;
    warehouseName?: string;
    price: number;
    cost: number;
    stockQuantity: number;
    minStock: number;
    unitName?: string;
    isActive: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class InventoryReportService {
    private apiUrl = `${environment.apiUrl}/Reports/Inventory`;

    constructor(private http: HttpClient) { }

    getReport(filters?: InventoryReportFilter): Observable<ApiResponse<InventoryReportItem[]>> {
        let params = new HttpParams();
        
        if (filters?.productId) {
            params = params.set('productId', filters.productId.toString());
        }
        if (filters?.warehouseId) {
            params = params.set('warehouseId', filters.warehouseId.toString());
        }
        if (filters?.classificationId) {
            params = params.set('classificationId', filters.classificationId.toString());
        }

        return this.http.get<ApiResponse<InventoryReportItem[]>>(this.apiUrl, { params });
    }

    exportToExcel(filters?: InventoryReportFilter): Observable<Blob> {
        let params = new HttpParams();
        
        if (filters?.productId) {
            params = params.set('productId', filters.productId.toString());
        }
        if (filters?.warehouseId) {
            params = params.set('warehouseId', filters.warehouseId.toString());
        }
        if (filters?.classificationId) {
            params = params.set('classificationId', filters.classificationId.toString());
        }

        return this.http.get(`${this.apiUrl}/Export`, { 
            params,
            responseType: 'blob' 
        });
    }
}






