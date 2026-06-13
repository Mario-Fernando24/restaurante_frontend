import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { AuthResponse, LoginApiPayload, LoginRequest } from '../models/auth.models';
import { TokenStorageService } from './token-storage.service';

const LOGIN_ENDPOINT = '/auth/login';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(
    private api: ApiService,
    private tokenStorage: TokenStorageService
  ) {}

  login(credentials: LoginRequest): Observable<AuthResponse> {
    const body: LoginApiPayload = {
      email: credentials.email.trim(),
      password: credentials.password,
    };

    return this.api.post<AuthResponse>(LOGIN_ENDPOINT, body).pipe(
      map((response) => {
        const token = this.extractToken(response);
        if (!token) {
          throw new Error('El servidor no devolvió un token válido');
        }
        return { ...response, accessToken: token };
      }),
      tap((response) => {
        this.tokenStorage.saveToken(response.accessToken!, credentials.rememberMe);
      }),
      catchError((error) => throwError(() => this.toLoginError(error)))
    );
  }

  logout(): void {
    this.tokenStorage.clearToken();
  }

  isAuthenticated(): boolean {
    return !!this.tokenStorage.getToken();
  }
  //  obtenemos la data del token para mostrar el nombre del usuario en el header de la app y para otras funcionalidades que requieran conocer la identidad del usuario
  private extractToken(response: AuthResponse): string | null {
    return (
      response.accessToken ??
      response.access_token ??
      response.access ??
      response.token ??
      null
    );
  }

  private toLoginError(error: unknown): Error {
    if (error instanceof HttpErrorResponse) {
      return new Error(this.parseHttpError(error));
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error('Error al iniciar sesión');
  }

  private parseHttpError(error: HttpErrorResponse): string {
    const body = error.error;

    if (typeof body === 'string' && body.trim()) {
      return body;
    }

    if (body && typeof body === 'object') {
      if (body.detail) return String(body.detail);
      if (body.message) return String(body.message);

      if (Array.isArray(body.non_field_errors) && body.non_field_errors[0]) {
        return body.non_field_errors[0];
      }

      const fieldError = body.email ?? body.password;
      if (Array.isArray(fieldError) && fieldError[0]) return fieldError[0];
      if (typeof fieldError === 'string') return fieldError;
    }

    if (error.status === 0) {
      return 'No se pudo conectar con el servidor';
    }

    if (error.status === 401 || error.status === 403) {
      return 'Correo o contraseña incorrectos';
    }

    return 'Error al iniciar sesión';
  }
}
