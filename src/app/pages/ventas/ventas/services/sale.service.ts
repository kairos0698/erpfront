import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { SaleDto, SaleResponseDto, PaymentDto, PaymentResponseDto } from '../models/sale.model';
import { ApiResponse } from '../../../../shared/models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class SaleService {
  private apiUrl = `${environment.apiUrl}/Sale`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<SaleResponseDto[]>> {
    return this.http.get<ApiResponse<SaleResponseDto[]>>(this.apiUrl);
  }

  getById(id: number): Observable<ApiResponse<SaleResponseDto>> {
    return this.http.get<ApiResponse<SaleResponseDto>>(`${this.apiUrl}/${id}`);
  }

  create(sale: SaleDto): Observable<ApiResponse<SaleResponseDto>> {
    return this.http.post<ApiResponse<SaleResponseDto>>(this.apiUrl, sale);
  }

  update(id: number, sale: SaleDto): Observable<ApiResponse<SaleResponseDto>> {
    return this.http.put<ApiResponse<SaleResponseDto>>(`${this.apiUrl}/${id}`, sale);
  }

  delete(id: number): Observable<ApiResponse<object>> {
    return this.http.delete<ApiResponse<object>>(`${this.apiUrl}/${id}`);
  }

  addPayment(id: number, payment: PaymentDto): Observable<ApiResponse<PaymentResponseDto>> {
    return this.http.post<ApiResponse<PaymentResponseDto>>(`${this.apiUrl}/${id}/add-payment`, payment);
  }

  export(format: string = 'pdf'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export?format=${format}`, {
      responseType: 'blob'
    });
  }
}

