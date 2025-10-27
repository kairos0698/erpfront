import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ApiResponse } from '../../../../shared/models/api-response.model';

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
    constructor(private http: HttpClient) { }

    getWarehouses(): Observable<ApiResponse<WarehouseResponseDto[]>> {
        return this.http.get<ApiResponse<WarehouseResponseDto[]>>(`${environment.apiUrl}/Warehouses`);
    }

    getProductClassifications(): Observable<ApiResponse<ProductClassificationResponseDto[]>> {
        return this.http.get<ApiResponse<ProductClassificationResponseDto[]>>(`${environment.apiUrl}/ProductClassifications`);
    }

    getUnits(): Observable<ApiResponse<UnitResponseDto[]>> {
        return this.http.get<ApiResponse<UnitResponseDto[]>>(`${environment.apiUrl}/Units`);
    }
}
