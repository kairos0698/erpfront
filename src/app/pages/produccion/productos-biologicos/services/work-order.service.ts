import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface WorkOrderEmployeeDto {
    employeeId: number;
    regionLotId?: number;
    activityId: number;
    quantity: number;
    unitCost: number;
    totalCost: number;
    materials: WorkOrderMaterialDto[];
    extraCosts: WorkOrderExtraCostDto[];
}

export interface WorkOrderMaterialDto {
    productId: number;
    quantity: number;
    unitCost: number;
    totalCost: number;
}

export interface WorkOrderExtraCostDto {
    extraCostId: number;
    quantity: number;
    unitCost: number;
    totalCost: number;
}

export interface WorkOrderDto {
    name: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    status: string;
    totalCost: number;
    biologicalProductPhaseId: number;
    employees?: WorkOrderEmployeeDto[];
}

export interface WorkOrderResponseDto extends WorkOrderDto {
    id: number;
    organizationId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface WorkOrderFilters {
    biologicalProductPhaseId?: number;
    status?: string;
    search?: string;
    page?: number;
    pageSize?: number;
}

@Injectable({
    providedIn: 'root'
})
export class WorkOrderService {
    private apiUrl = `${environment.apiUrl}/WorkOrders`;

    constructor(private http: HttpClient) { }

    getAll(filters?: WorkOrderFilters): Observable<WorkOrderResponseDto[]> {
        let params = new HttpParams();
        if (filters) {
            if (filters.biologicalProductPhaseId) params = params.set('biologicalProductPhaseId', filters.biologicalProductPhaseId.toString());
            if (filters.status) params = params.set('status', filters.status);
            if (filters.search) params = params.set('search', filters.search);
        }
        return this.http.get<WorkOrderResponseDto[]>(this.apiUrl, { params });
    }

    getById(id: number): Observable<WorkOrderResponseDto> {
        return this.http.get<WorkOrderResponseDto>(`${this.apiUrl}/${id}`);
    }

    create(dto: WorkOrderDto): Observable<WorkOrderResponseDto> {
        return this.http.post<WorkOrderResponseDto>(this.apiUrl, dto);
    }

    update(id: number, dto: WorkOrderDto): Observable<WorkOrderResponseDto> {
        return this.http.put<WorkOrderResponseDto>(`${this.apiUrl}/${id}`, dto);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    export(format: 'csv' | 'pdf'): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/export/${format}`, { responseType: 'blob' });
    }
}
