import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { PaymentPeriodDto, CreatePaymentPeriodDto, UpdatePaymentPeriodDto } from '../models/job-position.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentPeriodService {
  private apiUrl = `${environment.apiUrl}/PaymentPeriods`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<PaymentPeriodDto[]> {
    return this.http.get<PaymentPeriodDto[]>(this.apiUrl);
  }

  getById(id: number): Observable<PaymentPeriodDto> {
    return this.http.get<PaymentPeriodDto>(`${this.apiUrl}/${id}`);
  }

  create(paymentPeriod: CreatePaymentPeriodDto): Observable<PaymentPeriodDto> {
    return this.http.post<PaymentPeriodDto>(this.apiUrl, paymentPeriod);
  }

  update(id: number, paymentPeriod: UpdatePaymentPeriodDto): Observable<PaymentPeriodDto> {
    return this.http.put<PaymentPeriodDto>(`${this.apiUrl}/${id}`, paymentPeriod);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
