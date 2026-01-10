import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { LaborRiskDto, CreateLaborRiskDto, UpdateLaborRiskDto } from '../models/job-position.model';
import { CacheService } from '../../../../shared/services/cache.service';

@Injectable({
  providedIn: 'root'
})
export class LaborRiskService {
  private apiUrl = `${environment.apiUrl}/LaborRisks`;
  private readonly CACHE_KEY_ALL = 'laborrisks:all';
  private readonly CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutos

  constructor(
    private http: HttpClient,
    private cacheService: CacheService
  ) {}

  getAll(): Observable<LaborRiskDto[]> {
    return this.cacheService.getOrSet(
      this.CACHE_KEY_ALL,
      () => this.http.get<LaborRiskDto[]>(this.apiUrl),
      this.CACHE_EXPIRY
    );
  }

  getById(id: number): Observable<LaborRiskDto> {
    return this.http.get<LaborRiskDto>(`${this.apiUrl}/${id}`);
  }

  create(laborRisk: CreateLaborRiskDto): Observable<LaborRiskDto> {
    return this.http.post<LaborRiskDto>(this.apiUrl, laborRisk).pipe(
      tap(() => this.cacheService.invalidate(this.CACHE_KEY_ALL))
    );
  }

  update(id: number, laborRisk: UpdateLaborRiskDto): Observable<LaborRiskDto> {
    return this.http.put<LaborRiskDto>(`${this.apiUrl}/${id}`, laborRisk).pipe(
      tap(() => this.cacheService.invalidate(this.CACHE_KEY_ALL))
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.cacheService.invalidate(this.CACHE_KEY_ALL))
    );
  }
}
