import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';

export interface PostalCodeInfo {
  postalCode: string;
  neighborhood: string;
  street: string;
  city: string;
  state: string;
  country: string;
}

export interface NeighborhoodInfo {
  name: string;
  type: string;
  municipality: string;
  state: string;
  city: string;
}

@Injectable({
  providedIn: 'root'
})
export class PostalCodeService {
  private readonly API_BASE_URL = `${environment.apiUrl}/postalcode`;

  constructor(private http: HttpClient) {}

  /**
   * Verifica un código postal y obtiene información de la colonia y calle
   * @param postalCode Código postal a verificar
   * @returns Observable con la información del código postal
   */
  verifyPostalCode(postalCode: string): Observable<PostalCodeInfo | null> {
    if (!postalCode || postalCode.length !== 5) {
      return of(null);
    }

    // Usar el backend como proxy para APIs externas
    return this.http.get<any>(`${this.API_BASE_URL}/verify/${postalCode}`).pipe(
      map(response => {
        if (response && response.success && response.data) {
          return {
            postalCode: response.data.postalCode,
            neighborhood: response.data.neighborhood || '',
            street: response.data.street || '',
            city: response.data.city || '',
            state: response.data.state || '',
            country: response.data.country || 'México'
          };
        }
        return null;
      }),
      catchError(error => {
        console.error('Error verificando código postal:', error);
        return of(null);
      })
    );
  }

  /**
   * Método alternativo usando una API diferente si la primera falla
   * @param postalCode Código postal a verificar
   * @returns Observable con la información del código postal
   */
  verifyPostalCodeAlternative(postalCode: string): Observable<PostalCodeInfo | null> {
    if (!postalCode || postalCode.length !== 5) {
      return of(null);
    }

    // API alternativa - puedes cambiar esta URL por otra API gratuita
    const alternativeUrl = `https://api.codigopostal.mx/${postalCode}`;
    
    return this.http.get<any>(alternativeUrl).pipe(
      map(response => {
        if (response && response.codigo_postal) {
          return {
            postalCode: postalCode,
            neighborhood: response.colonia || '',
            street: response.calle || '',
            city: response.municipio || '',
            state: response.estado || '',
            country: 'México'
          };
        }
        return null;
      }),
      catchError(error => {
        console.error('Error verificando código postal (API alternativa):', error);
        return of(null);
      })
    );
  }

  /**
   * Verifica el código postal usando el backend como proxy
   * @param postalCode Código postal a verificar
   * @returns Observable con la información del código postal
   */
  verifyPostalCodeWithFallback(postalCode: string): Observable<PostalCodeInfo | null> {
    return this.verifyPostalCode(postalCode);
  }

  /**
   * Obtiene todas las colonias de un código postal
   * @param postalCode Código postal a consultar
   * @returns Observable con la lista de colonias
   */
  getNeighborhoods(postalCode: string): Observable<NeighborhoodInfo[]> {
    if (!postalCode || postalCode.length !== 5) {
      return of([]);
    }

    return this.http.get<any>(`${this.API_BASE_URL}/neighborhoods/${postalCode}`).pipe(
      map(response => {
        if (response && response.success && response.data) {
          return response.data.map((item: any) => ({
            name: item.name || '',
            type: item.type || '',
            municipality: item.municipality || '',
            state: item.state || '',
            city: item.city || ''
          }));
        }
        return [];
      }),
      catchError(error => {
        console.error('Error obteniendo colonias:', error);
        return of([]);
      })
    );
  }
}
