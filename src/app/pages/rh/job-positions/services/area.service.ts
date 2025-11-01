import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { AreaDto, CreateAreaDto, UpdateAreaDto } from '../models/job-position.model';

@Injectable({
  providedIn: 'root'
})
export class AreaService {
  private apiUrl = `${environment.apiUrl}/Areas`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<AreaDto[]> {
    return this.http.get<AreaDto[]>(this.apiUrl);
  }

  getById(id: number): Observable<AreaDto> {
    return this.http.get<AreaDto>(`${this.apiUrl}/${id}`);
  }

  create(area: CreateAreaDto): Observable<AreaDto> {
    return this.http.post<AreaDto>(this.apiUrl, area);
  }

  update(id: number, area: UpdateAreaDto): Observable<AreaDto> {
    return this.http.put<AreaDto>(`${this.apiUrl}/${id}`, area);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
