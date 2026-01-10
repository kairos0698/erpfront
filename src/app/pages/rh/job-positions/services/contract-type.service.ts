import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { ContractTypeDto, CreateContractTypeDto, UpdateContractTypeDto } from '../models/job-position.model';
import { CacheService } from '../../../../shared/services/cache.service';

@Injectable({
  providedIn: 'root'
})
export class ContractTypeService {
  private apiUrl = `${environment.apiUrl}/ContractTypes`;
  private readonly CACHE_KEY_ALL = 'contracttypes:all';
  private readonly CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutos

  constructor(
    private http: HttpClient,
    private cacheService: CacheService
  ) {}

  getAll(): Observable<ContractTypeDto[]> {
    return this.cacheService.getOrSet(
      this.CACHE_KEY_ALL,
      () => this.http.get<ContractTypeDto[]>(this.apiUrl),
      this.CACHE_EXPIRY
    );
  }

  getById(id: number): Observable<ContractTypeDto> {
    return this.http.get<ContractTypeDto>(`${this.apiUrl}/${id}`);
  }

  create(contractType: CreateContractTypeDto): Observable<ContractTypeDto> {
    return this.http.post<ContractTypeDto>(this.apiUrl, contractType).pipe(
      tap(() => this.cacheService.invalidate(this.CACHE_KEY_ALL))
    );
  }

  update(id: number, contractType: UpdateContractTypeDto): Observable<ContractTypeDto> {
    return this.http.put<ContractTypeDto>(`${this.apiUrl}/${id}`, contractType).pipe(
      tap(() => this.cacheService.invalidate(this.CACHE_KEY_ALL))
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.cacheService.invalidate(this.CACHE_KEY_ALL))
    );
  }
}
