import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { WorkShiftDto, CreateWorkShiftDto, UpdateWorkShiftDto } from '../models/job-position.model';
import { CacheService } from '../../../../shared/services/cache.service';

@Injectable({
  providedIn: 'root'
})
export class WorkShiftService {
  private apiUrl = `${environment.apiUrl}/WorkShifts`;
  private readonly CACHE_KEY_ALL = 'workshifts:all';
  private readonly CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutos

  constructor(
    private http: HttpClient,
    private cacheService: CacheService
  ) {}

  getAll(): Observable<WorkShiftDto[]> {
    return this.cacheService.getOrSet(
      this.CACHE_KEY_ALL,
      () => this.http.get<WorkShiftDto[]>(this.apiUrl),
      this.CACHE_EXPIRY
    );
  }

  getById(id: number): Observable<WorkShiftDto> {
    return this.http.get<WorkShiftDto>(`${this.apiUrl}/${id}`);
  }

  create(workShift: CreateWorkShiftDto): Observable<WorkShiftDto> {
    return this.http.post<WorkShiftDto>(this.apiUrl, workShift).pipe(
      tap(() => this.cacheService.invalidate(this.CACHE_KEY_ALL))
    );
  }

  update(id: number, workShift: UpdateWorkShiftDto): Observable<WorkShiftDto> {
    return this.http.put<WorkShiftDto>(`${this.apiUrl}/${id}`, workShift).pipe(
      tap(() => this.cacheService.invalidate(this.CACHE_KEY_ALL))
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.cacheService.invalidate(this.CACHE_KEY_ALL))
    );
  }
}
