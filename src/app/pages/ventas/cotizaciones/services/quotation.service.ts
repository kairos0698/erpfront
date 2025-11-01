import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { QuotationDto, QuotationResponseDto } from '../models/quotation.model';
import { OrderResponseDto } from '../../pedidos/models/order.model';
import { SaleResponseDto } from '../../ventas/models/sale.model';
import { ApiResponse } from '../../../../shared/models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class QuotationService {
  private apiUrl = `${environment.apiUrl}/Quotation`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<QuotationResponseDto[]>> {
    return this.http.get<ApiResponse<QuotationResponseDto[]>>(this.apiUrl);
  }

  getById(id: number): Observable<ApiResponse<QuotationResponseDto>> {
    return this.http.get<ApiResponse<QuotationResponseDto>>(`${this.apiUrl}/${id}`);
  }

  create(quotation: QuotationDto): Observable<ApiResponse<QuotationResponseDto>> {
    return this.http.post<ApiResponse<QuotationResponseDto>>(this.apiUrl, quotation);
  }

  update(id: number, quotation: QuotationDto): Observable<ApiResponse<QuotationResponseDto>> {
    return this.http.put<ApiResponse<QuotationResponseDto>>(`${this.apiUrl}/${id}`, quotation);
  }

  delete(id: number): Observable<ApiResponse<object>> {
    return this.http.delete<ApiResponse<object>>(`${this.apiUrl}/${id}`);
  }

  convertToOrder(id: number): Observable<ApiResponse<OrderResponseDto>> {
    return this.http.post<ApiResponse<OrderResponseDto>>(`${this.apiUrl}/${id}/convert-to-order`, {});
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

