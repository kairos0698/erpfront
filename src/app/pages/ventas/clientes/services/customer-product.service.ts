import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { CustomerProductDto, CustomerProductResponseDto } from '../models/customer-product.model';
import { ApiResponse } from '../../../../shared/models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerProductService {
  private apiUrl = `${environment.apiUrl}/CustomerProduct`;

  constructor(private http: HttpClient) {}

  getByCustomerId(customerId: number): Observable<ApiResponse<CustomerProductResponseDto[]>> {
    return this.http.get<ApiResponse<CustomerProductResponseDto[]>>(`${this.apiUrl}/customer/${customerId}`);
  }

  getById(id: number): Observable<ApiResponse<CustomerProductResponseDto>> {
    return this.http.get<ApiResponse<CustomerProductResponseDto>>(`${this.apiUrl}/${id}`);
  }

  create(customerProduct: CustomerProductDto): Observable<ApiResponse<CustomerProductResponseDto>> {
    return this.http.post<ApiResponse<CustomerProductResponseDto>>(this.apiUrl, customerProduct);
  }

  update(id: number, customerProduct: CustomerProductDto): Observable<ApiResponse<CustomerProductResponseDto>> {
    return this.http.put<ApiResponse<CustomerProductResponseDto>>(`${this.apiUrl}/${id}`, customerProduct);
  }

  delete(id: number): Observable<ApiResponse<object>> {
    return this.http.delete<ApiResponse<object>>(`${this.apiUrl}/${id}`);
  }
}

