import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { OrderDto, OrderResponseDto } from '../models/order.model';
import { SaleResponseDto } from '../../ventas/models/sale.model';
import { ApiResponse } from '../../../../shared/models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = `${environment.apiUrl}/Order`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<OrderResponseDto[]>> {
    return this.http.get<ApiResponse<OrderResponseDto[]>>(this.apiUrl);
  }

  getById(id: number): Observable<ApiResponse<OrderResponseDto>> {
    return this.http.get<ApiResponse<OrderResponseDto>>(`${this.apiUrl}/${id}`);
  }

  create(order: OrderDto): Observable<ApiResponse<OrderResponseDto>> {
    return this.http.post<ApiResponse<OrderResponseDto>>(this.apiUrl, order);
  }

  update(id: number, order: OrderDto): Observable<ApiResponse<OrderResponseDto>> {
    return this.http.put<ApiResponse<OrderResponseDto>>(`${this.apiUrl}/${id}`, order);
  }

  delete(id: number): Observable<ApiResponse<object>> {
    return this.http.delete<ApiResponse<object>>(`${this.apiUrl}/${id}`);
  }

  convertToSale(id: number): Observable<ApiResponse<SaleResponseDto>> {
    return this.http.post<ApiResponse<SaleResponseDto>>(`${this.apiUrl}/${id}/convert-to-sale`, {});
  }

  export(format: string = 'pdf'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export?format=${format}`, {
      responseType: 'blob'
    });
  }
}

