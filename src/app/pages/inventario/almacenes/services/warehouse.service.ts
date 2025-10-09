import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { WarehouseDto, WarehouseResponseDto } from '../models/warehouse.model';

@Injectable({
    providedIn: 'root'
})
export class WarehouseService {
    private apiUrl = `${environment.apiUrl}/Warehouses`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<WarehouseResponseDto[]> {
        return this.http.get<WarehouseResponseDto[]>(this.apiUrl);
    }

    getById(id: number): Observable<WarehouseResponseDto> {
        return this.http.get<WarehouseResponseDto>(`${this.apiUrl}/${id}`);
    }

    create(warehouse: WarehouseDto): Observable<WarehouseResponseDto> {
        return this.http.post<WarehouseResponseDto>(this.apiUrl, warehouse);
    }

    update(id: number, warehouse: WarehouseDto): Observable<WarehouseResponseDto> {
        return this.http.put<WarehouseResponseDto>(`${this.apiUrl}/${id}`, warehouse);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    export(format: string): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/export?format=${format}`, {
            responseType: 'blob'
        });
    }
}
