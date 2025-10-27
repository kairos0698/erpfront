import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ApiResponse } from '../../../../shared/models/api-response.model';

export interface BulkPayrollCalculationRequest {
  employeeIds: number[];
  startDate: Date;
  endDate: Date;
  notes?: string;
  calculateWorkOrders?: boolean;
}

export interface BulkPayrollCalculationResponse {
  totalEmployees: number;
  totalBaseSalary: number;
  totalWorkOrdersAmount: number;
  totalAmount: number;
  periodDays: number;
  startDate: Date;
  endDate: Date;
  notes?: string;
  employeeCalculations: EmployeePayrollCalculation[];
}

export interface EmployeePayrollCalculation {
  employeeId: number;
  employeeName: string;
  position: string;
  baseSalary: number;
  paymentPeriod: string;
  paymentPeriodDescription: string;
  dailyRate: number;
  calculatedAmount: number;
  workOrdersAmount: number;
  totalAmount: number;
  periodDays: number;
  workOrders: WorkOrderCalculation[];
}

export interface WorkOrderCalculation {
  workOrderId: number;
  workOrderName: string;
  workOrderDate: Date;
  activityName: string;
  employeeContribution: number;
  phaseName?: string;
  productName?: string;
  regionLotName?: string;
  totalCost?: number;
}

@Injectable({
  providedIn: 'root'
})
export class BulkPayrollService {
  private apiUrl = `${environment.apiUrl}/payrollbulk`;

  constructor(private http: HttpClient) {}

  calculateBulkPayroll(request: BulkPayrollCalculationRequest): Observable<ApiResponse<BulkPayrollCalculationResponse>> {
    return this.http.post<ApiResponse<BulkPayrollCalculationResponse>>(`${this.apiUrl}/calculate-bulk`, request);
  }
}
