import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { HierarchicalLevelDto, CreateHierarchicalLevelDto, UpdateHierarchicalLevelDto } from '../models/job-position.model';
import { CacheService } from '../../../../shared/services/cache.service';

@Injectable({
  providedIn: 'root'
})
export class HierarchicalLevelService {
  private apiUrl = `${environment.apiUrl}/HierarchicalLevels`;
  private readonly CACHE_KEY_ALL = 'hierarchicallevels:all';
  private readonly CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutos

  constructor(
    private http: HttpClient,
    private cacheService: CacheService
  ) {}

  getAll(): Observable<HierarchicalLevelDto[]> {
    return this.cacheService.getOrSet(
      this.CACHE_KEY_ALL,
      () => this.http.get<HierarchicalLevelDto[]>(this.apiUrl),
      this.CACHE_EXPIRY
    );
  }

  getById(id: number): Observable<HierarchicalLevelDto> {
    return this.http.get<HierarchicalLevelDto>(`${this.apiUrl}/${id}`);
  }

  create(level: CreateHierarchicalLevelDto): Observable<HierarchicalLevelDto> {
    return this.http.post<HierarchicalLevelDto>(this.apiUrl, level).pipe(
      tap(() => this.cacheService.invalidate(this.CACHE_KEY_ALL))
    );
  }

  update(id: number, level: UpdateHierarchicalLevelDto): Observable<HierarchicalLevelDto> {
    return this.http.put<HierarchicalLevelDto>(`${this.apiUrl}/${id}`, level).pipe(
      tap(() => this.cacheService.invalidate(this.CACHE_KEY_ALL))
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.cacheService.invalidate(this.CACHE_KEY_ALL))
    );
  }
}
