import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class BaseApiService {
  constructor(protected http: HttpClient) {}

  protected handleResponse<T>(response: ApiResponse<T>): T {
    if (response.success && response.data !== undefined) {
      return response.data;
    } else {
      throw new Error(response.message || 'Error en la operación');
    }
  }

  protected handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Error de conexión';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = `Error del servidor: ${error.status} - ${error.statusText}`;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }

  protected get<T>(url: string): Observable<T> {
    return this.http.get<ApiResponse<T>>(url).pipe(
      map(response => this.handleResponse(response)),
      catchError(this.handleError)
    );
  }

  protected post<T>(url: string, data: any): Observable<T> {
    return this.http.post<ApiResponse<T>>(url, data).pipe(
      map(response => this.handleResponse(response)),
      catchError(this.handleError)
    );
  }

  protected put<T>(url: string, data: any): Observable<T> {
    return this.http.put<ApiResponse<T>>(url, data).pipe(
      map(response => this.handleResponse(response)),
      catchError(this.handleError)
    );
  }

  protected delete<T>(url: string): Observable<T> {
    return this.http.delete<ApiResponse<T>>(url).pipe(
      map(response => this.handleResponse(response)),
      catchError(this.handleError)
    );
  }
}
