import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { JobPositionDto, CreateJobPositionDto, UpdateJobPositionDto } from '../models/job-position.model';

@Injectable({
  providedIn: 'root'
})
export class JobPositionService {
  private apiUrl = `${environment.apiUrl}/JobPositions`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<JobPositionDto[]> {
    return this.http.get<JobPositionDto[]>(this.apiUrl);
  }

  getById(id: number): Observable<JobPositionDto> {
    return this.http.get<JobPositionDto>(`${this.apiUrl}/${id}`);
  }

  create(jobPosition: CreateJobPositionDto): Observable<JobPositionDto> {
    return this.http.post<JobPositionDto>(this.apiUrl, jobPosition);
  }

  update(id: number, jobPosition: UpdateJobPositionDto): Observable<JobPositionDto> {
    return this.http.put<JobPositionDto>(`${this.apiUrl}/${id}`, jobPosition);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
