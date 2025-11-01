import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { WorkShiftDto, CreateWorkShiftDto, UpdateWorkShiftDto } from '../models/job-position.model';

@Injectable({
  providedIn: 'root'
})
export class WorkShiftService {
  private apiUrl = `${environment.apiUrl}/WorkShifts`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<WorkShiftDto[]> {
    return this.http.get<WorkShiftDto[]>(this.apiUrl);
  }

  getById(id: number): Observable<WorkShiftDto> {
    return this.http.get<WorkShiftDto>(`${this.apiUrl}/${id}`);
  }

  create(workShift: CreateWorkShiftDto): Observable<WorkShiftDto> {
    return this.http.post<WorkShiftDto>(this.apiUrl, workShift);
  }

  update(id: number, workShift: UpdateWorkShiftDto): Observable<WorkShiftDto> {
    return this.http.put<WorkShiftDto>(`${this.apiUrl}/${id}`, workShift);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
