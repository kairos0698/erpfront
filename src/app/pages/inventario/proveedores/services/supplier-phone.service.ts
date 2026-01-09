import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { SupplierPhoneDto, SupplierPhoneResponseDto } from '../models/supplier-phone.model';
import { ApiResponse } from '../../../../shared/models/api-response.model';

@Injectable({
    providedIn: 'root'
})
export class SupplierPhoneService {
    private apiUrl = `${environment.apiUrl}/SupplierPhone`;

    constructor(private http: HttpClient) { }

    getBySupplierId(supplierId: number): Observable<ApiResponse<SupplierPhoneResponseDto[]>> {
        return this.http.get<ApiResponse<SupplierPhoneResponseDto[]>>(`${this.apiUrl}/supplier/${supplierId}`);
    }

    getById(id: number): Observable<ApiResponse<SupplierPhoneResponseDto>> {
        return this.http.get<ApiResponse<SupplierPhoneResponseDto>>(`${this.apiUrl}/${id}`);
    }

    create(phone: SupplierPhoneDto): Observable<ApiResponse<SupplierPhoneResponseDto>> {
        return this.http.post<ApiResponse<SupplierPhoneResponseDto>>(this.apiUrl, phone);
    }

    update(id: number, phone: SupplierPhoneDto): Observable<ApiResponse<SupplierPhoneResponseDto>> {
        return this.http.put<ApiResponse<SupplierPhoneResponseDto>>(`${this.apiUrl}/${id}`, phone);
    }

    delete(id: number): Observable<ApiResponse<object>> {
        return this.http.delete<ApiResponse<object>>(`${this.apiUrl}/${id}`);
    }
}
