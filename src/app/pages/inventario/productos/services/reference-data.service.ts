import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

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

    getWarehouses(): Observable<WarehouseResponseDto[]> {
        return this.http.get<WarehouseResponseDto[]>(`${environment.apiUrl}/Warehouses`);
    }

    getProductClassifications(): Observable<ProductClassificationResponseDto[]> {
        return this.http.get<ProductClassificationResponseDto[]>(`${environment.apiUrl}/ProductClassifications`);
    }

    getUnits(): Observable<UnitResponseDto[]> {
        return this.http.get<UnitResponseDto[]>(`${environment.apiUrl}/Units`);
    }
}
