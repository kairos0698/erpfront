import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { SupplierAddressDto, SupplierAddressResponseDto } from '../models/supplier-address.model';
import { ApiResponse } from '../../../../shared/models/api-response.model';

@Injectable({
    providedIn: 'root'
})
export class SupplierAddressService {
    private apiUrl = `${environment.apiUrl}/SupplierAddress`;

    constructor(private http: HttpClient) { }

    getBySupplierId(supplierId: number): Observable<ApiResponse<SupplierAddressResponseDto[]>> {
        return this.http.get<ApiResponse<SupplierAddressResponseDto[]>>(`${this.apiUrl}/supplier/${supplierId}`);
    }

    getById(id: number): Observable<ApiResponse<SupplierAddressResponseDto>> {
        return this.http.get<ApiResponse<SupplierAddressResponseDto>>(`${this.apiUrl}/${id}`);
    }

    create(address: SupplierAddressDto): Observable<ApiResponse<SupplierAddressResponseDto>> {
        return this.http.post<ApiResponse<SupplierAddressResponseDto>>(this.apiUrl, address);
    }

    update(id: number, address: SupplierAddressDto): Observable<ApiResponse<SupplierAddressResponseDto>> {
        return this.http.put<ApiResponse<SupplierAddressResponseDto>>(`${this.apiUrl}/${id}`, address);
    }

    delete(id: number): Observable<ApiResponse<object>> {
        return this.http.delete<ApiResponse<object>>(`${this.apiUrl}/${id}`);
    }
}
