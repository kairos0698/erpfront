import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { WarehouseDto, WarehouseResponseDto } from '../models/warehouse.model';
import { ApiResponse } from '../../../../shared/models/api-response.model';

@Injectable({
    providedIn: 'root'
})
export class WarehouseService {
    private apiUrl = `${environment.apiUrl}/Warehouses`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<ApiResponse<WarehouseResponseDto[]>> {
        return this.http.get<ApiResponse<WarehouseResponseDto[]>>(this.apiUrl);
    }

    getById(id: number): Observable<ApiResponse<WarehouseResponseDto>> {
        return this.http.get<ApiResponse<WarehouseResponseDto>>(`${this.apiUrl}/${id}`);
    }

    create(warehouse: WarehouseDto): Observable<ApiResponse<WarehouseResponseDto>> {
        return this.http.post<ApiResponse<WarehouseResponseDto>>(this.apiUrl, warehouse);
    }

    update(id: number, warehouse: WarehouseDto): Observable<ApiResponse<WarehouseResponseDto>> {
        return this.http.put<ApiResponse<WarehouseResponseDto>>(`${this.apiUrl}/${id}`, warehouse);
    }

    delete(id: number): Observable<ApiResponse<object>> {
        return this.http.delete<ApiResponse<object>>(`${this.apiUrl}/${id}`);
    }

    export(format: string): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/export?format=${format}`, {
            responseType: 'blob'
        });
    }
}
