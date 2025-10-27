import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { environment } from '../../../environments/environment';

// Ejemplo de DTOs
export interface ExampleDto {
  id: number;
  name: string;
  description: string;
}

export interface ExampleResponseDto extends ExampleDto {
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ExampleApiService extends BaseApiService {
  private apiUrl = `${environment.apiUrl}/Examples`;

  constructor(http: any) {
    super(http);
  }

  getAll(): Observable<ExampleResponseDto[]> {
    return this.get<ExampleResponseDto[]>(this.apiUrl);
  }

  getById(id: number): Observable<ExampleResponseDto> {
    return this.get<ExampleResponseDto>(`${this.apiUrl}/${id}`);
  }

  create(dto: ExampleDto): Observable<ExampleResponseDto> {
    return this.post<ExampleResponseDto>(this.apiUrl, dto);
  }

  update(id: number, dto: ExampleDto): Observable<ExampleResponseDto> {
    return this.put<ExampleResponseDto>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/${id}`);
  }
}
