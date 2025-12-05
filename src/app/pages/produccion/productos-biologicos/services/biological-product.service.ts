import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { BiologicalProductDto, BiologicalProductResponseDto, BiologicalProductFilters, ProductType } from '../models/biological-product.model';
import { ApiResponse } from '../../../../shared/models/api-response.model';

@Injectable({
    providedIn: 'root'
})
export class BiologicalProductService {
    private apiUrl = `${environment.apiUrl}/Products`;

    constructor(private http: HttpClient) { }

    getAll(filters?: BiologicalProductFilters): Observable<ApiResponse<BiologicalProductResponseDto[]>> {
        let params = new HttpParams();
        if (filters) {
            if (filters.search) params = params.set('search', filters.search);
            if (filters.isActive !== undefined) params = params.set('isActive', filters.isActive.toString());
        }
        
        // Agregar filtro de tipo en los parámetros para que el backend lo maneje
        params = params.set('type', ProductType.BiologicalProduct.toString());
        
        return this.http.get<ApiResponse<any[]>>(this.apiUrl, { params }).pipe(
            map(response => {
                console.log('📦 Respuesta completa del backend:', response);
                // Filtrar por tipo como respaldo (por si el backend no lo hace)
                // El backend devuelve type como string "BiologicalProduct", comparar como string
                const filteredData = (response.data?.filter((product: any) => {
                    // Comparar tanto el enum numérico como el string
                    const typeValue = product.type;
                    // Comparar con el string "BiologicalProduct" que es lo que devuelve el backend
                    // o con el enum ProductType.BiologicalProduct (que es 4)
                    const isBiological = typeValue === 'BiologicalProduct' || 
                                       (typeof typeValue === 'number' && typeValue === ProductType.BiologicalProduct);
                    console.log('🔍 Producto:', product.name, 'Type:', typeValue, 'TypeOf:', typeof typeValue, 'IsBiological:', isBiological);
                    return isBiological;
                }) || []).map((product: any) => {
                    // Mapear 'cost' del backend a ambos 'cost' y 'price' del frontend para compatibilidad
                    const costValue = product.cost !== undefined ? product.cost : (product.price !== undefined ? product.price : 0);
                    return {
                        ...product,
                        cost: costValue,
                        price: costValue // Mantener price para compatibilidad con el código existente
                    };
                });
                console.log('📦 Total productos recibidos:', response.data?.length || 0);
                console.log('📦 Productos filtrados por tipo:', filteredData.length);
                console.log('📦 Productos filtrados:', filteredData);
                return {
                    ...response,
                    data: filteredData
                };
            })
        );
    }

    getById(id: number): Observable<ApiResponse<BiologicalProductResponseDto>> {
        return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${id}`).pipe(
            map(response => {
                // Mapear 'cost' del backend a ambos 'cost' y 'price' del frontend para compatibilidad
                if (response.data) {
                    const costValue = response.data.cost !== undefined ? response.data.cost : (response.data.price !== undefined ? response.data.price : 0);
                    return {
                        ...response,
                        data: {
                            ...response.data,
                            cost: costValue,
                            price: costValue // Mantener price para compatibilidad
                        }
                    };
                }
                return response;
            })
        );
    }

    create(dto: BiologicalProductDto): Observable<ApiResponse<BiologicalProductResponseDto>> {
        // Mapear 'cost' o 'price' del frontend a 'cost' del backend
        const costValue = dto.cost !== undefined ? dto.cost : (dto.price !== undefined ? dto.price : 0);
        const backendDto: any = {
            ...dto,
            cost: costValue,
            price: costValue // Mantener price también por compatibilidad
        };
        return this.http.post<ApiResponse<any>>(this.apiUrl, backendDto).pipe(
            map(response => {
                // Mapear 'cost' del backend a ambos 'cost' y 'price' del frontend para compatibilidad
                if (response.data) {
                    const costValue = response.data.cost !== undefined ? response.data.cost : (response.data.price !== undefined ? response.data.price : 0);
                    return {
                        ...response,
                        data: {
                            ...response.data,
                            cost: costValue,
                            price: costValue // Mantener price para compatibilidad
                        }
                    };
                }
                return response;
            })
        );
    }

    update(id: number, dto: BiologicalProductDto): Observable<ApiResponse<BiologicalProductResponseDto>> {
        // Mapear 'cost' o 'price' del frontend a 'cost' del backend
        const costValue = dto.cost !== undefined ? dto.cost : (dto.price !== undefined ? dto.price : 0);
        const backendDto: any = {
            ...dto,
            cost: costValue,
            price: costValue // Mantener price también por compatibilidad
        };
        return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${id}`, backendDto).pipe(
            map(response => {
                // Mapear 'cost' del backend a ambos 'cost' y 'price' del frontend para compatibilidad
                if (response.data) {
                    const costValue = response.data.cost !== undefined ? response.data.cost : (response.data.price !== undefined ? response.data.price : 0);
                    return {
                        ...response,
                        data: {
                            ...response.data,
                            cost: costValue,
                            price: costValue // Mantener price para compatibilidad
                        }
                    };
                }
                return response;
            })
        );
    }

    delete(id: number): Observable<ApiResponse<object>> {
        return this.http.delete<ApiResponse<object>>(`${this.apiUrl}/${id}`);
    }

    export(format: 'csv' | 'pdf'): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/export/${format}`, { params: { type: ProductType.BiologicalProduct.toString() }, responseType: 'blob' });
    }
}
