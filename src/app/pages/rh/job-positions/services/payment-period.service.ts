import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { PaymentPeriodDto, CreatePaymentPeriodDto, UpdatePaymentPeriodDto } from '../models/job-position.model';
import { CacheService } from '../../../../shared/services/cache.service';

@Injectable({
  providedIn: 'root'
})
export class PaymentPeriodService {
  private apiUrl = `${environment.apiUrl}/PaymentPeriods`;
  private readonly CACHE_KEY_ALL = 'paymentperiods:all';
  private readonly CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutos

  constructor(
    private http: HttpClient,
    private cacheService: CacheService
  ) {}

  getAll(): Observable<PaymentPeriodDto[]> {
    return this.cacheService.getOrSet(
      this.CACHE_KEY_ALL,
      () => this.http.get<PaymentPeriodDto[]>(this.apiUrl),
      this.CACHE_EXPIRY
    );
  }

  getById(id: number): Observable<PaymentPeriodDto> {
    return this.http.get<PaymentPeriodDto>(`${this.apiUrl}/${id}`);
  }

  create(paymentPeriod: CreatePaymentPeriodDto): Observable<PaymentPeriodDto> {
    return this.http.post<PaymentPeriodDto>(this.apiUrl, paymentPeriod).pipe(
      tap(() => this.cacheService.invalidate(this.CACHE_KEY_ALL))
    );
  }

  update(id: number, paymentPeriod: UpdatePaymentPeriodDto): Observable<PaymentPeriodDto> {
    return this.http.put<PaymentPeriodDto>(`${this.apiUrl}/${id}`, paymentPeriod).pipe(
      tap(() => this.cacheService.invalidate(this.CACHE_KEY_ALL))
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.cacheService.invalidate(this.CACHE_KEY_ALL))
    );
  }
}
