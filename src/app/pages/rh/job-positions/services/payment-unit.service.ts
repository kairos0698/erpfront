import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { PaymentUnitDto, CreatePaymentUnitDto, UpdatePaymentUnitDto } from '../models/job-position.model';
import { CacheService } from '../../../../shared/services/cache.service';

@Injectable({
  providedIn: 'root'
})
export class PaymentUnitService {
  private apiUrl = `${environment.apiUrl}/PaymentUnits`;
  private readonly CACHE_KEY_ALL = 'paymentunits:all';
  private readonly CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutos

  constructor(
    private http: HttpClient,
    private cacheService: CacheService
  ) {}

  getAll(): Observable<PaymentUnitDto[]> {
    return this.cacheService.getOrSet(
      this.CACHE_KEY_ALL,
      () => this.http.get<PaymentUnitDto[]>(this.apiUrl),
      this.CACHE_EXPIRY
    );
  }

  getById(id: number): Observable<PaymentUnitDto> {
    return this.http.get<PaymentUnitDto>(`${this.apiUrl}/${id}`);
  }

  create(paymentUnit: CreatePaymentUnitDto): Observable<PaymentUnitDto> {
    return this.http.post<PaymentUnitDto>(this.apiUrl, paymentUnit).pipe(
      tap(() => this.cacheService.invalidate(this.CACHE_KEY_ALL))
    );
  }

  update(id: number, paymentUnit: UpdatePaymentUnitDto): Observable<PaymentUnitDto> {
    return this.http.put<PaymentUnitDto>(`${this.apiUrl}/${id}`, paymentUnit).pipe(
      tap(() => this.cacheService.invalidate(this.CACHE_KEY_ALL))
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.cacheService.invalidate(this.CACHE_KEY_ALL))
    );
  }
}
