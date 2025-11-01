import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ApiResponse } from '../../../../shared/models/api-response.model';

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
export class UnitService {
    private apiUrl = `${environment.apiUrl}/Units`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<ApiResponse<UnitResponseDto[]>> {
        return this.http.get<ApiResponse<UnitResponseDto[]>>(this.apiUrl);
    }

    getById(id: number): Observable<UnitResponseDto> {
        return this.http.get<UnitResponseDto>(`${this.apiUrl}/${id}`);
    }
}
