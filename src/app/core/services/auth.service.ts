import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { SessionExpiredService } from './session-expired.service';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  organizationName: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  token: string; // Alias for accessToken
}

export interface User {
  id: string;
  username: string;
  email: string;
  organizationId: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/Auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private sessionExpiredService: SessionExpiredService;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Inyectar SessionExpiredService usando inject()
    this.sessionExpiredService = inject(SessionExpiredService);
    // Check for existing token on service initialization
    this.checkStoredToken();
  }

  /**
   * Verifica si el token está expirado
   * @returns true si el token está expirado, false en caso contrario
   */
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) {
      return true;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = payload.exp * 1000 < Date.now();
      return isExpired;
    } catch (error) {
      // Token inválido
      return true;
    }
  }

  /**
   * Verifica el token y muestra el modal si está expirado
   * @returns true si el token está expirado y se mostró el modal
   */
  checkAndHandleTokenExpiration(): boolean {
    if (this.isTokenExpired()) {
      this.sessionExpiredService.showSessionExpiredModal();
      return true;
    }
    return false;
  }

  login(credentials: LoginRequest): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          this.storeTokens(response);
          this.decodeAndStoreUser(response.accessToken);
          // Redirect to dashboard after successful login
          this.router.navigate(['/']);
        })
      );
  }

  register(userData: RegisterRequest): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.apiUrl}/register`, userData)
      .pipe(
        tap(response => {
          this.storeTokens(response);
          this.decodeAndStoreUser(response.accessToken);
          // Redirect to dashboard after successful registration
          this.router.navigate(['/']);
        })
      );
  }

  refreshToken(): Observable<TokenResponse> {
    const refreshToken = localStorage.getItem('refreshToken');
    const accessToken = localStorage.getItem('accessToken');
    
    if (!refreshToken || !accessToken) {
      throw new Error('No tokens available for refresh');
    }

    return this.http.post<TokenResponse>(`${this.apiUrl}/refresh`, {
      token: accessToken,
      refreshToken: refreshToken
    }).pipe(
      tap(response => {
        this.storeTokens(response);
        this.decodeAndStoreUser(response.accessToken);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    // Redirect to login after logout
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('accessToken');
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = payload.exp * 1000 < Date.now();
      return !isExpired;
    } catch {
      return false;
    }
  }

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  private storeTokens(response: TokenResponse): void {
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
  }

  private decodeAndStoreUser(token: string): void {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const user: User = {
        id: payload.nameid || payload.sub,
        username: payload.unique_name,
        email: payload.email,
        organizationId: payload.organizationId,
        role: payload.role
      };
      localStorage.setItem('user', JSON.stringify(user));
      this.currentUserSubject.next(user);
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  }

  private checkStoredToken(): void {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      // Verificar si el token está expirado
      if (this.isAuthenticated()) {
        try {
          const userData = JSON.parse(user);
          this.currentUserSubject.next(userData);
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          this.logout();
        }
      } else {
        // Token expirado: mostrar modal en lugar de logout directo
        this.sessionExpiredService.showSessionExpiredModal();
      }
    } else {
      // No hay token ni usuario, limpiar pero no redirigir si ya está en login
      if (!this.router.url.includes('/login')) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        this.currentUserSubject.next(null);
      }
    }
  }
}
