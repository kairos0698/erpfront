import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { SupplierDto, SupplierResponseDto } from '../models/supplier.model';

@Injectable({
    providedIn: 'root'
})
export class SupplierService {
    private apiUrl = `${environment.apiUrl}/Suppliers`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<SupplierResponseDto[]> {
        return this.http.get<SupplierResponseDto[]>(this.apiUrl);
    }

    getById(id: number): Observable<SupplierResponseDto> {
        return this.http.get<SupplierResponseDto>(`${this.apiUrl}/${id}`);
    }

    create(supplier: SupplierDto): Observable<SupplierResponseDto> {
        return this.http.post<SupplierResponseDto>(this.apiUrl, supplier);
    }

    update(id: number, supplier: SupplierDto): Observable<SupplierResponseDto> {
        return this.http.put<SupplierResponseDto>(`${this.apiUrl}/${id}`, supplier);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
