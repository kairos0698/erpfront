import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { HierarchicalLevelDto, CreateHierarchicalLevelDto, UpdateHierarchicalLevelDto } from '../models/job-position.model';

@Injectable({
  providedIn: 'root'
})
export class HierarchicalLevelService {
  private apiUrl = `${environment.apiUrl}/HierarchicalLevels`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<HierarchicalLevelDto[]> {
    return this.http.get<HierarchicalLevelDto[]>(this.apiUrl);
  }

  getById(id: number): Observable<HierarchicalLevelDto> {
    return this.http.get<HierarchicalLevelDto>(`${this.apiUrl}/${id}`);
  }

  create(level: CreateHierarchicalLevelDto): Observable<HierarchicalLevelDto> {
    return this.http.post<HierarchicalLevelDto>(this.apiUrl, level);
  }

  update(id: number, level: UpdateHierarchicalLevelDto): Observable<HierarchicalLevelDto> {
    return this.http.put<HierarchicalLevelDto>(`${this.apiUrl}/${id}`, level);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
