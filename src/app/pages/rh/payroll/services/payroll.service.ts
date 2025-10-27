import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ApiResponse } from '../../../../shared/models/api-response.model';

export interface PayrollDto {
    employeeId: number;
    startDate: Date;
    endDate: Date;
    baseSalary: number;
    workOrdersTotal: number;
    totalAmount: number;
    status: PayrollStatus;
    paymentDate?: Date | null;
    notes?: string;
    isPaid: boolean;
}

export interface PayrollResponseDto extends PayrollDto {
    id: number;
    organizationId: string;
    createdAt: Date;
    updatedAt: Date;
    employeeName?: string;
    employeePosition?: string;
    statusName?: string;
}

export interface PayrollCalculationDto {
    employeeId: number;
    startDate: Date;
    endDate: Date;
    baseSalary: number;
    workOrdersTotal: number;
    totalAmount: number;
    workOrders: WorkOrderSummaryDto[];
}

export interface WorkOrderSummaryDto {
    workOrderId: number;
    workOrderName: string;
    workOrderDate: Date;
    employeeContribution: number;
    activityName: string;
}

export interface PayrollCalculationRequestDto {
    employeeId: number;
    startDate: Date;
    endDate: Date;
}

export interface MarkAsPaidDto {
    paymentDate?: Date;
    notes?: string;
}

export enum PayrollStatus {
    Pending = 1,
    Paid = 2,
    Cancelled = 3
}

export interface PayrollFilters {
    employeeId?: number;
    startDate?: Date;
    endDate?: Date;
    status?: PayrollStatus;
    isPaid?: boolean;
    page?: number;
    pageSize?: number;
}

@Injectable({
    providedIn: 'root'
})
export class PayrollService {
    private apiUrl = `${environment.apiUrl}/Payrolls`;

    constructor(private http: HttpClient) { }

    getAll(filters?: PayrollFilters): Observable<ApiResponse<PayrollResponseDto[]>> {
        let params = new HttpParams();
        if (filters) {
            if (filters.employeeId) params = params.set('employeeId', filters.employeeId.toString());
            if (filters.startDate) params = params.set('startDate', filters.startDate.toISOString());
            if (filters.endDate) params = params.set('endDate', filters.endDate.toISOString());
            if (filters.status) params = params.set('status', filters.status.toString());
            if (filters.isPaid !== undefined) params = params.set('isPaid', filters.isPaid.toString());
        }
        return this.http.get<ApiResponse<PayrollResponseDto[]>>(this.apiUrl, { params });
    }

    getById(id: number): Observable<ApiResponse<PayrollResponseDto>> {
        return this.http.get<ApiResponse<PayrollResponseDto>>(`${this.apiUrl}/${id}`);
    }

    calculatePayroll(request: PayrollCalculationRequestDto): Observable<ApiResponse<PayrollCalculationDto>> {
        return this.http.post<ApiResponse<PayrollCalculationDto>>(`${this.apiUrl}/calculate`, request);
    }

    create(dto: PayrollDto): Observable<ApiResponse<PayrollResponseDto>> {
        return this.http.post<ApiResponse<PayrollResponseDto>>(this.apiUrl, dto);
    }

    update(id: number, dto: PayrollDto): Observable<ApiResponse<PayrollResponseDto>> {
        return this.http.put<ApiResponse<PayrollResponseDto>>(`${this.apiUrl}/${id}`, dto);
    }

    markAsPaid(id: number, dto: MarkAsPaidDto): Observable<ApiResponse<PayrollResponseDto>> {
        return this.http.put<ApiResponse<PayrollResponseDto>>(`${this.apiUrl}/${id}/mark-paid`, dto);
    }

    delete(id: number): Observable<ApiResponse<object>> {
        return this.http.delete<ApiResponse<object>>(`${this.apiUrl}/${id}`);
    }

    export(format: 'csv' | 'pdf'): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/export/${format}`, { responseType: 'blob' });
    }
}
