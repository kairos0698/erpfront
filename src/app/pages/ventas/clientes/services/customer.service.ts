import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { CustomerDto, CustomerResponseDto } from '../models/customer.model';
import { ApiResponse } from '../../../../shared/models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private apiUrl = `${environment.apiUrl}/SalesCustomer`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<CustomerResponseDto[]>> {
    return this.http.get<ApiResponse<CustomerResponseDto[]>>(this.apiUrl);
  }

  getById(id: number): Observable<ApiResponse<CustomerResponseDto>> {
    return this.http.get<ApiResponse<CustomerResponseDto>>(`${this.apiUrl}/${id}`);
  }

  create(customer: CustomerDto): Observable<ApiResponse<CustomerResponseDto>> {
    return this.http.post<ApiResponse<CustomerResponseDto>>(this.apiUrl, customer);
  }

  update(id: number, customer: CustomerDto): Observable<ApiResponse<CustomerResponseDto>> {
    return this.http.put<ApiResponse<CustomerResponseDto>>(`${this.apiUrl}/${id}`, customer);
  }

  delete(id: number): Observable<ApiResponse<object>> {
    return this.http.delete<ApiResponse<object>>(`${this.apiUrl}/${id}`);
  }
}

