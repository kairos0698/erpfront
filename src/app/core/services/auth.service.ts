import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

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

  constructor(private http: HttpClient) {
    // Check for existing token on service initialization
    this.checkStoredToken();
  }

  login(credentials: LoginRequest): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          this.storeTokens(response);
          this.decodeAndStoreUser(response.accessToken);
        })
      );
  }

  register(userData: RegisterRequest): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.apiUrl}/register`, userData)
      .pipe(
        tap(response => {
          this.storeTokens(response);
          this.decodeAndStoreUser(response.accessToken);
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
    
    if (token && user && this.isAuthenticated()) {
      try {
        const userData = JSON.parse(user);
        this.currentUserSubject.next(userData);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        this.logout();
      }
    } else {
      this.logout();
    }
  }
}
