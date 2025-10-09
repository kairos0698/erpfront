import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ProductDto, ProductResponseDto } from '../models/product.model';

@Injectable({
    providedIn: 'root'
})
export class ProductService {
    private apiUrl = `${environment.apiUrl}/Products`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<ProductResponseDto[]> {
        return this.http.get<ProductResponseDto[]>(this.apiUrl);
    }

    getById(id: number): Observable<ProductResponseDto> {
        return this.http.get<ProductResponseDto>(`${this.apiUrl}/${id}`);
    }

    create(product: ProductDto): Observable<ProductResponseDto> {
        console.log('Enviando producto al backend:', product);
        return this.http.post<ProductResponseDto>(this.apiUrl, product);
    }

    update(id: number, product: ProductDto): Observable<ProductResponseDto> {
        return this.http.put<ProductResponseDto>(`${this.apiUrl}/${id}`, product);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
