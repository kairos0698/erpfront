import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { LaborRiskDto, CreateLaborRiskDto, UpdateLaborRiskDto } from '../models/job-position.model';

@Injectable({
  providedIn: 'root'
})
export class LaborRiskService {
  private apiUrl = `${environment.apiUrl}/LaborRisks`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<LaborRiskDto[]> {
    return this.http.get<LaborRiskDto[]>(this.apiUrl);
  }

  getById(id: number): Observable<LaborRiskDto> {
    return this.http.get<LaborRiskDto>(`${this.apiUrl}/${id}`);
  }

  create(laborRisk: CreateLaborRiskDto): Observable<LaborRiskDto> {
    return this.http.post<LaborRiskDto>(this.apiUrl, laborRisk);
  }

  update(id: number, laborRisk: UpdateLaborRiskDto): Observable<LaborRiskDto> {
    return this.http.put<LaborRiskDto>(`${this.apiUrl}/${id}`, laborRisk);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
