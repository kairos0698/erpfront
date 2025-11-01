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

export interface CreateBulkPayrollRequest {
  name?: string;
  startDate: Date;
  endDate: Date;
  notes?: string;
  calculationResult: BulkPayrollCalculationResponse;
}

export interface PayrollResponse {
  id: number;
  name: string;
  startDate: Date;
  endDate: Date;
  status: string;
  notes?: string;
  totalAmount: number;
  totalBaseSalary: number;
  totalWorkOrdersAmount: number;
  totalEmployees: number;
  periodDays: number;
  paymentDate?: Date;
  paymentNotes?: string;
  createdAt: Date;
  modifiedAt?: Date;
  createdByUserName?: string;
  modifiedByUserName?: string;
  payrollEmployees?: PayrollEmployeeResponse[];
}

export interface PayrollEmployeeResponse {
  id: number;
  employeeId: number;
  employeeName: string;
  position: string;
  baseSalary: number;
  paymentPeriod: string;
  calculatedAmount: number;
  workOrdersAmount: number;
  totalAmount: number;
  periodDays: number;
  dailyRate: number;
  status: string;
  notes?: string;
  payrollWorkOrders?: PayrollWorkOrderResponse[];
}

export interface PayrollWorkOrderResponse {
  id: number;
  workOrderId: number;
  workOrderName: string;
  workOrderDate: Date;
  activityName?: string;
  employeeContribution: number;
  totalCost: number;
  phaseName?: string;
  productName?: string;
  regionLotName?: string;
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

  createBulkPayroll(request: CreateBulkPayrollRequest): Observable<ApiResponse<PayrollResponse>> {
    return this.http.post<ApiResponse<PayrollResponse>>(`${this.apiUrl}/create-bulk`, request);
  }
}
