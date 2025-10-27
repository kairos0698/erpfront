import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ApiResponse } from '../../../../shared/models/api-response.model';

export interface BiologicalPhaseDto {
    id?: number;
    name: string;
    description?: string;
    phaseDate?: Date;
    productId: number;
    isActive: boolean;
}

export interface BiologicalPhaseResponseDto extends BiologicalPhaseDto {
    id: number;
    isDefault: boolean;
    totalCost: number;
    statusId?: number;
    status?: {
        id: number;
        name: string;
        description?: string;
        color?: string;
        sortOrder: number;
    };
    organizationId: string;
    createdAt: Date;
    updatedAt: Date;
    productName?: string;
}

@Injectable({
    providedIn: 'root'
})
export class BiologicalPhaseService {
    private apiUrl = `${environment.apiUrl}/BiologicalProductPhases`;

    constructor(private http: HttpClient) { }

    getByProductId(productId: number): Observable<ApiResponse<BiologicalPhaseResponseDto[]>> {
        return this.http.get<ApiResponse<BiologicalPhaseResponseDto[]>>(`${this.apiUrl}/product/${productId}`);
    }

    getById(id: number): Observable<ApiResponse<BiologicalPhaseResponseDto>> {
        return this.http.get<ApiResponse<BiologicalPhaseResponseDto>>(`${this.apiUrl}/${id}`);
    }

    create(dto: BiologicalPhaseDto): Observable<ApiResponse<BiologicalPhaseResponseDto>> {
        return this.http.post<ApiResponse<BiologicalPhaseResponseDto>>(this.apiUrl, dto);
    }

    update(id: number, dto: BiologicalPhaseDto): Observable<ApiResponse<BiologicalPhaseResponseDto>> {
        return this.http.put<ApiResponse<BiologicalPhaseResponseDto>>(`${this.apiUrl}/${id}`, dto);
    }

    delete(id: number): Observable<ApiResponse<object>> {
        return this.http.delete<ApiResponse<object>>(`${this.apiUrl}/${id}`);
    }
}
