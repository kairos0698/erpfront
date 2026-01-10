import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { JobPositionDto, CreateJobPositionDto, UpdateJobPositionDto } from '../models/job-position.model';
import { CacheService } from '../../../../shared/services/cache.service';

@Injectable({
  providedIn: 'root'
})
export class JobPositionService {
  private apiUrl = `${environment.apiUrl}/JobPositions`;
  private readonly CACHE_KEY_ALL = 'jobpositions:all';
  private readonly CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutos

  constructor(
    private http: HttpClient,
    private cacheService: CacheService
  ) {}

  getAll(): Observable<JobPositionDto[]> {
    return this.cacheService.getOrSet(
      this.CACHE_KEY_ALL,
      () => this.http.get<JobPositionDto[]>(this.apiUrl),
      this.CACHE_EXPIRY
    );
  }

  getById(id: number): Observable<JobPositionDto> {
    return this.http.get<JobPositionDto>(`${this.apiUrl}/${id}`);
  }

  create(jobPosition: CreateJobPositionDto): Observable<JobPositionDto> {
    return this.http.post<JobPositionDto>(this.apiUrl, jobPosition).pipe(
      tap(() => this.cacheService.invalidate(this.CACHE_KEY_ALL))
    );
  }

  update(id: number, jobPosition: UpdateJobPositionDto): Observable<JobPositionDto> {
    return this.http.put<JobPositionDto>(`${this.apiUrl}/${id}`, jobPosition).pipe(
      tap(() => this.cacheService.invalidate(this.CACHE_KEY_ALL))
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.cacheService.invalidate(this.CACHE_KEY_ALL))
    );
  }
}
