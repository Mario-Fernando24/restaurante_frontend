import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { AuthResponse, LoginRequest } from '../models/auth.models';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(
    private api: ApiService,
    private tokenStorage: TokenStorageService
  ) {}

  login(credentials: LoginRequest): Observable<AuthResponse> {
    // Cuando el backend esté listo, usar:
    // return this.api.post<AuthResponse>('/auth/login', credentials);

    if (!credentials.email || !credentials.password) {
      return throwError(() => new Error('Credenciales inválidas'));
    }

    return of({ accessToken: 'mock-token', expiresIn: 3600 }).pipe(
      delay(800),
      tap((response) => {
        this.tokenStorage.saveToken(response.accessToken, credentials.rememberMe);
      })
    );
  }

  logout(): void {
    this.tokenStorage.clearToken();
  }

  isAuthenticated(): boolean {
    return !!this.tokenStorage.getToken();
  }
}
