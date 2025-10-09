import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ExtraCostDto, ExtraCostResponseDto, ExtraCostFilters } from '../models/extra-cost.model';

@Injectable({
    providedIn: 'root'
})
export class ExtraCostService {
    private apiUrl = `${environment.apiUrl}/ExtraCosts`;

    constructor(private http: HttpClient) { }

    getAll(filters?: ExtraCostFilters): Observable<ExtraCostResponseDto[]> {
        let params = new HttpParams();
        if (filters) {
            if (filters.search) params = params.set('search', filters.search);
            if (filters.isActive !== undefined) params = params.set('isActive', filters.isActive.toString());
        }
        return this.http.get<ExtraCostResponseDto[]>(this.apiUrl, { params });
    }

    getById(id: number): Observable<ExtraCostResponseDto> {
        return this.http.get<ExtraCostResponseDto>(`${this.apiUrl}/${id}`);
    }

    create(dto: ExtraCostDto): Observable<ExtraCostResponseDto> {
        return this.http.post<ExtraCostResponseDto>(this.apiUrl, dto);
    }

    update(id: number, dto: ExtraCostDto): Observable<ExtraCostResponseDto> {
        return this.http.put<ExtraCostResponseDto>(`${this.apiUrl}/${id}`, dto);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    export(format: 'csv' | 'pdf'): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/export/${format}`, { responseType: 'blob' });
    }
}
