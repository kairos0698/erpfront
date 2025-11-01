import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { PaymentUnitDto, CreatePaymentUnitDto, UpdatePaymentUnitDto } from '../models/job-position.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentUnitService {
  private apiUrl = `${environment.apiUrl}/PaymentUnits`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<PaymentUnitDto[]> {
    return this.http.get<PaymentUnitDto[]>(this.apiUrl);
  }

  getById(id: number): Observable<PaymentUnitDto> {
    return this.http.get<PaymentUnitDto>(`${this.apiUrl}/${id}`);
  }

  create(paymentUnit: CreatePaymentUnitDto): Observable<PaymentUnitDto> {
    return this.http.post<PaymentUnitDto>(this.apiUrl, paymentUnit);
  }

  update(id: number, paymentUnit: UpdatePaymentUnitDto): Observable<PaymentUnitDto> {
    return this.http.put<PaymentUnitDto>(`${this.apiUrl}/${id}`, paymentUnit);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
