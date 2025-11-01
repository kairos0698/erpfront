import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { CustomerOriginDto, CustomerOriginResponseDto } from '../models/customer-origin.model';
import { ApiResponse } from '../../../../shared/models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerOriginService {
  private apiUrl = `${environment.apiUrl}/CustomerOrigin`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<CustomerOriginResponseDto[]>> {
    return this.http.get<ApiResponse<CustomerOriginResponseDto[]>>(this.apiUrl);
  }

  getById(id: number): Observable<ApiResponse<CustomerOriginResponseDto>> {
    return this.http.get<ApiResponse<CustomerOriginResponseDto>>(`${this.apiUrl}/${id}`);
  }

  create(customerOrigin: CustomerOriginDto): Observable<ApiResponse<CustomerOriginResponseDto>> {
    return this.http.post<ApiResponse<CustomerOriginResponseDto>>(this.apiUrl, customerOrigin);
  }

  update(id: number, customerOrigin: CustomerOriginDto): Observable<ApiResponse<CustomerOriginResponseDto>> {
    return this.http.put<ApiResponse<CustomerOriginResponseDto>>(`${this.apiUrl}/${id}`, customerOrigin);
  }

  delete(id: number): Observable<ApiResponse<object>> {
    return this.http.delete<ApiResponse<object>>(`${this.apiUrl}/${id}`);
  }
}

