import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { PriceListDto, PriceListResponseDto } from '../models/price-list.model';
import { ApiResponse } from '../../../../shared/models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class PriceListService {
  private apiUrl = `${environment.apiUrl}/PriceList`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<PriceListResponseDto[]>> {
    return this.http.get<ApiResponse<PriceListResponseDto[]>>(this.apiUrl);
  }

  getById(id: number): Observable<ApiResponse<PriceListResponseDto>> {
    return this.http.get<ApiResponse<PriceListResponseDto>>(`${this.apiUrl}/${id}`);
  }

  create(priceList: PriceListDto): Observable<ApiResponse<PriceListResponseDto>> {
    return this.http.post<ApiResponse<PriceListResponseDto>>(this.apiUrl, priceList);
  }

  update(id: number, priceList: PriceListDto): Observable<ApiResponse<PriceListResponseDto>> {
    return this.http.put<ApiResponse<PriceListResponseDto>>(`${this.apiUrl}/${id}`, priceList);
  }

  delete(id: number): Observable<ApiResponse<object>> {
    return this.http.delete<ApiResponse<object>>(`${this.apiUrl}/${id}`);
  }
}

