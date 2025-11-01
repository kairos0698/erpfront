import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ShiftDto, CreateShiftDto, UpdateShiftDto } from '../models/job-position.model';

@Injectable({
  providedIn: 'root'
})
export class ShiftService {
  private apiUrl = `${environment.apiUrl}/Shifts`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ShiftDto[]> {
    return this.http.get<ShiftDto[]>(this.apiUrl);
  }

  getById(id: number): Observable<ShiftDto> {
    return this.http.get<ShiftDto>(`${this.apiUrl}/${id}`);
  }

  create(shift: CreateShiftDto): Observable<ShiftDto> {
    return this.http.post<ShiftDto>(this.apiUrl, shift);
  }

  update(id: number, shift: UpdateShiftDto): Observable<ShiftDto> {
    return this.http.put<ShiftDto>(`${this.apiUrl}/${id}`, shift);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
