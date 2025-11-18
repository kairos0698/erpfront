import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { CropDto } from '../models/activity.model';
import { ApiResponse } from '../../../../shared/models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class CropService {
  private apiUrl = `${environment.apiUrl}/Crops`;
  private http = inject(HttpClient);

  getAll(): Observable<ApiResponse<CropDto[]>> {
    return this.http.get<ApiResponse<CropDto[]>>(this.apiUrl);
  }
}

