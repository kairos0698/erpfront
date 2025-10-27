import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BiologicalPhaseStatusDto } from '../models/biological-phase-status.model';
import { environment } from '../../../../../environments/environment';
import { ApiResponse } from '../../../../shared/models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class BiologicalPhaseStatusService {
  private apiUrl = `${environment.apiUrl}/BiologicalPhaseStatuses`;

  constructor(private http: HttpClient) { }

  getAll(): Observable<ApiResponse<BiologicalPhaseStatusDto[]>> {
    return this.http.get<ApiResponse<BiologicalPhaseStatusDto[]>>(this.apiUrl);
  }

  getById(id: number): Observable<BiologicalPhaseStatusDto> {
    return this.http.get<BiologicalPhaseStatusDto>(`${this.apiUrl}/${id}`);
  }
}
