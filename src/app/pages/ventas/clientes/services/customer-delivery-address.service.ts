import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { CustomerDeliveryAddressDto, CustomerDeliveryAddressResponseDto } from '../models/customer-delivery-address.model';
import { ApiResponse } from '../../../../shared/models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerDeliveryAddressService {
  private apiUrl = `${environment.apiUrl}/CustomerDeliveryAddress`;

  constructor(private http: HttpClient) {}

  getByCustomerId(customerId: number): Observable<ApiResponse<CustomerDeliveryAddressResponseDto[]>> {
    return this.http.get<ApiResponse<CustomerDeliveryAddressResponseDto[]>>(`${this.apiUrl}/customer/${customerId}`);
  }

  getById(id: number): Observable<ApiResponse<CustomerDeliveryAddressResponseDto>> {
    return this.http.get<ApiResponse<CustomerDeliveryAddressResponseDto>>(`${this.apiUrl}/${id}`);
  }

  create(address: CustomerDeliveryAddressDto): Observable<ApiResponse<CustomerDeliveryAddressResponseDto>> {
    return this.http.post<ApiResponse<CustomerDeliveryAddressResponseDto>>(this.apiUrl, address);
  }

  update(id: number, address: CustomerDeliveryAddressDto): Observable<ApiResponse<CustomerDeliveryAddressResponseDto>> {
    return this.http.put<ApiResponse<CustomerDeliveryAddressResponseDto>>(`${this.apiUrl}/${id}`, address);
  }

  delete(id: number): Observable<ApiResponse<object>> {
    return this.http.delete<ApiResponse<object>>(`${this.apiUrl}/${id}`);
  }
}

