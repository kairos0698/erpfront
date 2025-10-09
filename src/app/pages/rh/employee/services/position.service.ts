import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { PositionDto, PositionResponseDto, PositionFilters } from '../models/position.model';

@Injectable({
  providedIn: 'root'
})
export class PositionService {
  private apiUrl = `${environment.apiUrl}/Positions`;
  private http = inject(HttpClient);

  getAll(): Observable<PositionResponseDto[]> {
    return this.http.get<PositionResponseDto[]>(this.apiUrl);
  }

  getById(id: number): Observable<PositionResponseDto> {
    return this.http.get<PositionResponseDto>(`${this.apiUrl}/${id}`);
  }

  create(position: PositionDto): Observable<PositionResponseDto> {
    return this.http.post<PositionResponseDto>(this.apiUrl, position);
  }

  update(id: number, position: PositionDto): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, position);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
