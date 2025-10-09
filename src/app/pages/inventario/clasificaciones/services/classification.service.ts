import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ProductClassificationDto, ProductClassificationResponseDto } from '../models/classification.model';

@Injectable({
    providedIn: 'root'
})
export class ClassificationService {
    private apiUrl = `${environment.apiUrl}/ProductClassifications`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<ProductClassificationResponseDto[]> {
        return this.http.get<ProductClassificationResponseDto[]>(this.apiUrl);
    }

    getById(id: number): Observable<ProductClassificationResponseDto> {
        return this.http.get<ProductClassificationResponseDto>(`${this.apiUrl}/${id}`);
    }

    create(classification: ProductClassificationDto): Observable<ProductClassificationResponseDto> {
        return this.http.post<ProductClassificationResponseDto>(this.apiUrl, classification);
    }

    update(id: number, classification: ProductClassificationDto): Observable<ProductClassificationResponseDto> {
        return this.http.put<ProductClassificationResponseDto>(`${this.apiUrl}/${id}`, classification);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
