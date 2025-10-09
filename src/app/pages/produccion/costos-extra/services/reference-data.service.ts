import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

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
        return this.http.get<UnitResponseDto[]>(`${environment.apiUrl}/Units`);
    }
}
