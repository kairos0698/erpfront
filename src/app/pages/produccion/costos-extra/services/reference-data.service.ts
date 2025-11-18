import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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
export class ReferenceDataService {
    constructor(private http: HttpClient) { }

    getUnits(): Observable<UnitResponseDto[]> {
        return this.http.get<ApiResponse<UnitResponseDto[]>>(`${environment.apiUrl}/Units`).pipe(
            map((response) => {
                if (response.success && response.data) {
                    return Array.isArray(response.data) ? response.data : [];
                }
                return [];
            })
        );
    }
}
