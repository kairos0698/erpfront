import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { CustomerFiscalDataDto, CustomerFiscalDataResponseDto } from '../models/customer-fiscal-data.model';
import { ApiResponse } from '../../../../shared/models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerFiscalDataService {
  private apiUrl = `${environment.apiUrl}/CustomerFiscalData`;

  constructor(private http: HttpClient) {}

  getByCustomerId(customerId: number): Observable<ApiResponse<CustomerFiscalDataResponseDto>> {
    return this.http.get<ApiResponse<CustomerFiscalDataResponseDto>>(`${this.apiUrl}/customer/${customerId}`);
  }

  create(fiscalData: CustomerFiscalDataDto): Observable<ApiResponse<CustomerFiscalDataResponseDto>> {
    return this.http.post<ApiResponse<CustomerFiscalDataResponseDto>>(this.apiUrl, fiscalData);
  }

  update(id: number, fiscalData: CustomerFiscalDataDto): Observable<ApiResponse<CustomerFiscalDataResponseDto>> {
    return this.http.put<ApiResponse<CustomerFiscalDataResponseDto>>(`${this.apiUrl}/${id}`, fiscalData);
  }
}

