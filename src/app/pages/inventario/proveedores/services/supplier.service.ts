import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { SupplierDto, SupplierResponseDto } from '../models/supplier.model';
import { ApiResponse } from '../../../../shared/models/api-response.model';

@Injectable({
    providedIn: 'root'
})
export class SupplierService {
    private apiUrl = `${environment.apiUrl}/Suppliers`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<ApiResponse<SupplierResponseDto[]>> {
        return this.http.get<ApiResponse<SupplierResponseDto[]>>(this.apiUrl);
    }

    getById(id: number): Observable<ApiResponse<SupplierResponseDto>> {
        return this.http.get<ApiResponse<SupplierResponseDto>>(`${this.apiUrl}/${id}`);
    }

    create(supplier: SupplierDto): Observable<ApiResponse<SupplierResponseDto>> {
        return this.http.post<ApiResponse<SupplierResponseDto>>(this.apiUrl, supplier);
    }

    update(id: number, supplier: SupplierDto): Observable<ApiResponse<SupplierResponseDto>> {
        return this.http.put<ApiResponse<SupplierResponseDto>>(`${this.apiUrl}/${id}`, supplier);
    }

    delete(id: number): Observable<ApiResponse<object>> {
        return this.http.delete<ApiResponse<object>>(`${this.apiUrl}/${id}`);
    }
}
