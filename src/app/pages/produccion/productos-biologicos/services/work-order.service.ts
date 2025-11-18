import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ApiResponse } from '../../../../shared/models/api-response.model';

export enum CostCalculationMode {
    No = 0,
    OnlyDailyCost = 1,
    Combine = 2
}

export interface WorkOrderEmployeeDto {
    employeeId: number;
    regionLotId?: number;
    quantity: number;
    unitCost: number;
    totalCost: number;
    unitId?: number;
    unitName?: string;
    costCalculationMode?: CostCalculationMode; // Modo de cálculo (solo para fase Cosecha)
    days?: number; // Número de días (solo para fase Cosecha con OnlyDailyCost o Combine)
    materials: WorkOrderMaterialDto[];
    extraCosts: WorkOrderExtraCostDto[];
}

export interface WorkOrderMaterialDto {
    productId: number;
    quantity: number;
    unitCost: number;
    totalCost: number;
    unitId?: number;
    unitName?: string;
}

export interface WorkOrderExtraCostDto {
    extraCostId: number;
    quantity: number;
    unitCost: number;
    totalCost: number;
    unitId?: number;
    unitName?: string;
}

export interface WorkOrderDto {
    name?: string;
    description?: string;
    customDate?: Date | null; // Nueva fecha personalizada del usuario
    status: string;
    statusId?: number; // ID del estado (requerido por el backend)
    totalCost: number;
    biologicalProductPhaseId: number;
    activityId: number; // Actividad general de la orden
    regionLotId?: number; // Región/Lote de la orden
    employees?: WorkOrderEmployeeDto[];
    globalMaterials?: WorkOrderMaterialDto[]; // Materiales globales de la orden
    globalExtraCosts?: WorkOrderExtraCostDto[]; // Costos extra globales de la orden
    id?: number;
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

    getAll(filters?: WorkOrderFilters): Observable<ApiResponse<WorkOrderResponseDto[]>> {
        let params = new HttpParams();
        if (filters) {
            if (filters.biologicalProductPhaseId) params = params.set('biologicalProductPhaseId', filters.biologicalProductPhaseId.toString());
            if (filters.status) params = params.set('status', filters.status);
            if (filters.search) params = params.set('search', filters.search);
        }
        return this.http.get<ApiResponse<WorkOrderResponseDto[]>>(this.apiUrl, { params });
    }

    getById(id: number): Observable<ApiResponse<WorkOrderResponseDto>> {
        return this.http.get<ApiResponse<WorkOrderResponseDto>>(`${this.apiUrl}/${id}`);
    }

    create(dto: WorkOrderDto): Observable<ApiResponse<WorkOrderResponseDto>> {
        return this.http.post<ApiResponse<WorkOrderResponseDto>>(this.apiUrl, dto);
    }

    update(id: number, dto: WorkOrderDto): Observable<ApiResponse<WorkOrderResponseDto>> {
        return this.http.put<ApiResponse<WorkOrderResponseDto>>(`${this.apiUrl}/${id}`, dto);
    }

    delete(id: number): Observable<ApiResponse<object>> {
        return this.http.delete<ApiResponse<object>>(`${this.apiUrl}/${id}`);
    }

    export(format: 'csv' | 'pdf'): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/export/${format}`, { responseType: 'blob' });
    }
}
