import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { RegionLotDto, RegionLotResponseDto, RegionLotFilters } from '../models/region-lot.model';

@Injectable({
    providedIn: 'root'
})
export class RegionLotService {
    private apiUrl = `${environment.apiUrl}/RegionLots`;

    constructor(private http: HttpClient) { }

    getAll(filters?: RegionLotFilters): Observable<RegionLotResponseDto[]> {
        let params = new HttpParams();
        if (filters) {
            if (filters.search) params = params.set('search', filters.search);
            if (filters.isActive !== undefined) params = params.set('isActive', filters.isActive.toString());
        }
        return this.http.get<RegionLotResponseDto[]>(this.apiUrl, { params });
    }

    getById(id: number): Observable<RegionLotResponseDto> {
        return this.http.get<RegionLotResponseDto>(`${this.apiUrl}/${id}`);
    }

    create(dto: RegionLotDto): Observable<RegionLotResponseDto> {
        return this.http.post<RegionLotResponseDto>(this.apiUrl, dto);
    }

    update(id: number, dto: RegionLotDto): Observable<RegionLotResponseDto> {
        return this.http.put<RegionLotResponseDto>(`${this.apiUrl}/${id}`, dto);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    export(format: 'csv' | 'pdf'): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/export/${format}`, { responseType: 'blob' });
    }
}
