import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ApiResponse } from '../../../../shared/models/api-response.model';

export interface ProductionReportFilter {
    startDate?: Date;
    endDate?: Date;
    productIds?: number[]; // Array de IDs de productos (vacío = todos)
    regionIds?: number[]; // Array de IDs de regiones (vacío = todos)
    activityIds?: number[]; // Array de IDs de actividades (vacío = todas)
    workOrderStatusIds?: number[]; // Array de status IDs (por defecto [3] = Completadas)
    materialIds?: number[]; // Array de IDs de materiales/insumos (depende del producto)
    employeeIds?: number[]; // Array de IDs de empleados (vacío = todos)
    extraCostIds?: number[]; // Array de IDs de costos extra (vacío = todos)
    phaseIds?: number[]; // Array de IDs de fases (depende del producto)
    groupBy?: string; // Para reporte agrupado: 'Employee', 'Region', 'Activity', 'ExtraCost', 'Phase', 'Material'
    groupByIds?: number[]; // IDs de los items del agrupador seleccionados
}

export interface ProductionReportItem {
    folio: string; // Folio de la orden de trabajo
    date: Date; // Fecha de la orden
    biologicalProductId: number;
    biologicalProductName: string;
    unitsProduced: number; // Stock del producto biológico
    totalCost: number; // Suma de totales de órdenes completadas
    costPerUnit: number; // Costo por unidad (totalCost / unitsProduced)
    // Campos adicionales para análisis
    phaseId?: number;
    phaseName?: string;
    activityId?: number;
    activityName?: string;
    regionId?: number;
    regionName?: string;
    employeeId?: number;
    employeeName?: string;
    workOrderStatusId: number;
    workOrderStatusName: string;
}

export interface ProductionReportNodeData {
    name: string;
    folio?: string;
    date?: Date;
    createdAt?: Date;
    biologicalProductId?: number;
    biologicalProductName?: string;
    phaseId?: number;
    phaseName?: string;
    workOrderId?: number;
    activityId?: number;
    activityName?: string;
    regionId?: number;
    regionName?: string;
    employeeId?: number;
    employeeName?: string;
    workOrderStatusId?: number;
    workOrderStatusName?: string;
    unitsProduced: number;
    totalCost: number;
    costPerUnit: number;
    nonHarvestPhasesUsed?: string; // Fases no-cosecha utilizadas (separadas por comas)
}

export interface ProductionReportTreeNode {
    key: string;
    nodeType: string; // "Product", "Phase", "WorkOrder"
    data: ProductionReportNodeData;
    children?: ProductionReportTreeNode[];
}

@Injectable({
    providedIn: 'root'
})
export class ProductionReportService {
    private apiUrl = `${environment.apiUrl}/Reports/Production`;

    constructor(private http: HttpClient) { }

    getReportTree(filters?: ProductionReportFilter): Observable<ApiResponse<ProductionReportTreeNode[]>> {
        let params = new HttpParams();
        
        if (filters?.startDate) {
            params = params.set('startDate', filters.startDate.toISOString());
        }
        if (filters?.endDate) {
            params = params.set('endDate', filters.endDate.toISOString());
        }
        if (filters?.productIds && filters.productIds.length > 0) {
            filters.productIds.forEach(id => {
                params = params.append('productIds', id.toString());
            });
        }
        if (filters?.regionIds && filters.regionIds.length > 0) {
            filters.regionIds.forEach(id => {
                params = params.append('regionIds', id.toString());
            });
        }
        if (filters?.activityIds && filters.activityIds.length > 0) {
            filters.activityIds.forEach(id => {
                params = params.append('activityIds', id.toString());
            });
        }
        if (filters?.workOrderStatusIds && filters.workOrderStatusIds.length > 0) {
            filters.workOrderStatusIds.forEach(id => {
                params = params.append('workOrderStatusIds', id.toString());
            });
        } else {
            // Por defecto, solo Completadas (statusId = 3)
            params = params.append('workOrderStatusIds', '3');
        }
        if (filters?.materialIds && filters.materialIds.length > 0) {
            filters.materialIds.forEach(id => {
                params = params.append('materialIds', id.toString());
            });
        }
        if (filters?.employeeIds && filters.employeeIds.length > 0) {
            filters.employeeIds.forEach(id => {
                params = params.append('employeeIds', id.toString());
            });
        }
        if (filters?.extraCostIds && filters.extraCostIds.length > 0) {
            filters.extraCostIds.forEach(id => {
                params = params.append('extraCostIds', id.toString());
            });
        }
        if (filters?.phaseIds && filters.phaseIds.length > 0) {
            filters.phaseIds.forEach(id => {
                params = params.append('phaseIds', id.toString());
            });
        }

        return this.http.get<ApiResponse<ProductionReportTreeNode[]>>(`${this.apiUrl}/Tree`, { params });
    }

    getReport(filters?: ProductionReportFilter): Observable<ApiResponse<ProductionReportItem[]>> {
        let params = new HttpParams();
        
        if (filters?.startDate) {
            params = params.set('startDate', filters.startDate.toISOString());
        }
        if (filters?.endDate) {
            params = params.set('endDate', filters.endDate.toISOString());
        }
        if (filters?.productIds && filters.productIds.length > 0) {
            filters.productIds.forEach(id => {
                params = params.append('productIds', id.toString());
            });
        }
        if (filters?.regionIds && filters.regionIds.length > 0) {
            filters.regionIds.forEach(id => {
                params = params.append('regionIds', id.toString());
            });
        }
        if (filters?.activityIds && filters.activityIds.length > 0) {
            filters.activityIds.forEach(id => {
                params = params.append('activityIds', id.toString());
            });
        }
        if (filters?.workOrderStatusIds && filters.workOrderStatusIds.length > 0) {
            filters.workOrderStatusIds.forEach(id => {
                params = params.append('workOrderStatusIds', id.toString());
            });
        } else {
            // Por defecto, solo Completadas (statusId = 3)
            params = params.append('workOrderStatusIds', '3');
        }
        if (filters?.materialIds && filters.materialIds.length > 0) {
            filters.materialIds.forEach(id => {
                params = params.append('materialIds', id.toString());
            });
        }
        if (filters?.employeeIds && filters.employeeIds.length > 0) {
            filters.employeeIds.forEach(id => {
                params = params.append('employeeIds', id.toString());
            });
        }
        if (filters?.extraCostIds && filters.extraCostIds.length > 0) {
            filters.extraCostIds.forEach(id => {
                params = params.append('extraCostIds', id.toString());
            });
        }
        if (filters?.phaseIds && filters.phaseIds.length > 0) {
            filters.phaseIds.forEach(id => {
                params = params.append('phaseIds', id.toString());
            });
        }

        return this.http.get<ApiResponse<ProductionReportItem[]>>(this.apiUrl, { params });
    }

    getGroupedReport(filters?: ProductionReportFilter): Observable<ApiResponse<ProductionReportTreeNode[]>> {
        let params = new HttpParams();
        
        if (filters?.startDate) {
            params = params.set('startDate', filters.startDate.toISOString());
        }
        if (filters?.endDate) {
            params = params.set('endDate', filters.endDate.toISOString());
        }
        if (filters?.groupBy) {
            params = params.set('groupBy', filters.groupBy);
        }
        if (filters?.groupByIds && filters.groupByIds.length > 0) {
            filters.groupByIds.forEach(id => {
                params = params.append('groupByIds', id.toString());
            });
        }
        if (filters?.productIds && filters.productIds.length > 0) {
            filters.productIds.forEach(id => {
                params = params.append('productIds', id.toString());
            });
        }
        if (filters?.phaseIds && filters.phaseIds.length > 0) {
            filters.phaseIds.forEach(id => {
                params = params.append('phaseIds', id.toString());
            });
        }
        if (filters?.activityIds && filters.activityIds.length > 0) {
            filters.activityIds.forEach(id => {
                params = params.append('activityIds', id.toString());
            });
        }
        if (filters?.employeeIds && filters.employeeIds.length > 0) {
            filters.employeeIds.forEach(id => {
                params = params.append('employeeIds', id.toString());
            });
        }
        if (filters?.regionIds && filters.regionIds.length > 0) {
            filters.regionIds.forEach(id => {
                params = params.append('regionIds', id.toString());
            });
        }
        if (filters?.extraCostIds && filters.extraCostIds.length > 0) {
            filters.extraCostIds.forEach(id => {
                params = params.append('extraCostIds', id.toString());
            });
        }
        if (filters?.materialIds && filters.materialIds.length > 0) {
            filters.materialIds.forEach(id => {
                params = params.append('materialIds', id.toString());
            });
        }

        return this.http.get<ApiResponse<ProductionReportTreeNode[]>>(`${this.apiUrl}/Grouped`, { params });
    }

    exportToExcel(filters?: ProductionReportFilter, isGrouped: boolean = false): Observable<Blob> {
        let params = new HttpParams();
        
        if (filters?.startDate) {
            params = params.set('startDate', filters.startDate.toISOString());
        }
        if (filters?.endDate) {
            params = params.set('endDate', filters.endDate.toISOString());
        }
        
        // Agregar todos los filtros adicionales
        if (filters?.productIds && filters.productIds.length > 0) {
            filters.productIds.forEach(id => {
                params = params.append('productIds', id.toString());
            });
        }
        if (filters?.phaseIds && filters.phaseIds.length > 0) {
            filters.phaseIds.forEach(id => {
                params = params.append('phaseIds', id.toString());
            });
        }
        if (filters?.activityIds && filters.activityIds.length > 0) {
            filters.activityIds.forEach(id => {
                params = params.append('activityIds', id.toString());
            });
        }
        if (filters?.employeeIds && filters.employeeIds.length > 0) {
            filters.employeeIds.forEach(id => {
                params = params.append('employeeIds', id.toString());
            });
        }
        if (filters?.regionIds && filters.regionIds.length > 0) {
            filters.regionIds.forEach(id => {
                params = params.append('regionIds', id.toString());
            });
        }
        if (filters?.extraCostIds && filters.extraCostIds.length > 0) {
            filters.extraCostIds.forEach(id => {
                params = params.append('extraCostIds', id.toString());
            });
        }
        if (filters?.materialIds && filters.materialIds.length > 0) {
            filters.materialIds.forEach(id => {
                params = params.append('materialIds', id.toString());
            });
        }
        
        if (isGrouped) {
            // Para reporte agrupado
            if (filters?.groupBy) {
                params = params.set('groupBy', filters.groupBy);
            }
            if (filters?.groupByIds && filters.groupByIds.length > 0) {
                filters.groupByIds.forEach(id => {
                    params = params.append('groupByIds', id.toString());
                });
            }
            return this.http.get(`${this.apiUrl}/Grouped/Export`, { 
                params,
                responseType: 'blob' 
            });
        } else {
            // Para reporte general
            return this.http.get(`${this.apiUrl}/Export`, { 
                params,
                responseType: 'blob' 
            });
        }
    }
}

