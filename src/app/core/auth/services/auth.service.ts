import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { getDefaultRouteByRole, ROUTES } from '../../routing/route-paths';
import { ApiService } from '../../services/api.service';
import {
  LoginApiPayload,
  LoginRequest,
  LoginResponse,
  Usuario,
} from '../models/auth.models';
import { TokenStorageService } from './token-storage.service';
import { UserStorageService } from './user-storage.service';

const LOGIN_ENDPOINT = '/auth/login/';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(
    private api: ApiService,
    private tokenStorage: TokenStorageService,
    private userStorage: UserStorageService
  ) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    const body: LoginApiPayload = {
      email: credentials.email.trim(),
      password: credentials.password,
    };
  // unknown ayuda a que TypeScript no infiera el tipo de la respuesta de la API, lo cual es útil si la API puede devolver diferentes estructuras de datos. Luego, se normaliza la respuesta para asegurarse de que tenga un formato consistente.
    return this.api.post<unknown>(LOGIN_ENDPOINT, body).pipe(
      map((raw) => this.normalizeLoginResponse(raw)),
      tap((response) => {
        this.userStorage.saveUser(response.usuario, credentials.rememberMe);

        const token = this.extractToken(response);
        if (token) {
          this.tokenStorage.saveToken(token, credentials.rememberMe);
        }
      }),
      catchError((error) => throwError(() => this.toLoginError(error)))
    );
  }

  logout(): void {
    this.tokenStorage.clearToken();
    this.userStorage.clearUser();
  }

  isAuthenticated(): boolean {
    return !!this.tokenStorage.getToken() || !!this.userStorage.getUser();
  }

  getCurrentUser(): Usuario | null {
    return this.userStorage.getUser();
  }

  getUserFullName(): string {
    const user = this.getCurrentUser();
    if (!user) return '';
    return `${user.nombre} ${user.apellido}`.trim();
  }

  getUserRole(): string {
    return this.getCurrentUser()?.rol?.nombre ?? '';
  }

  getUserRoleId(): number | null {
    const id = this.getCurrentUser()?.rol?.id_rol;
    return id != null ? Number(id) : null;
  }

  /** Ruta a la que debe ir el usuario según su rol */
  getDefaultRouteForUser(usuario?: Usuario | null): string {
    // Si no se proporciona un usuario, se intenta obtener el usuario actual
    const user = usuario ?? this.getCurrentUser();
    if (!user?.rol?.id_rol) {
      return ROUTES.LOGIN;
    }
    return getDefaultRouteByRole(user.rol.id_rol);
  }

  private normalizeLoginResponse(raw: unknown): LoginResponse {
    const data = (raw ?? {}) as Record<string, unknown>;
    const usuario = this.normalizeUsuario(data['usuario'] ?? data['user']);

    if (!usuario) {
      throw new Error(String(data['mensaje'] ?? data['message'] ?? 'Error al iniciar sesión'));
    }

    const ok =
      data['ok'] === true ||
      data['ok'] === 'true' ||
      data['success'] === true ||
      !!usuario;

    return {
      ok,
      mensaje: String(data['mensaje'] ?? data['message'] ?? 'Login correcto'),
      usuario,
      accessToken: this.pickString(data, ['accessToken', 'access_token', 'token']),
      access_token: this.pickString(data, ['access_token']),
      token: this.pickString(data, ['token']),
    };
  }

  private normalizeUsuario(raw: unknown): Usuario | null {
    if (!raw || typeof raw !== 'object') return null;

    const u = raw as Record<string, unknown>;
    const rolRaw = u['rol'];

    let idRol: number | null = null;
    let nombreRol = 'Usuario';

    if (rolRaw && typeof rolRaw === 'object') {
      const rol = rolRaw as Record<string, unknown>;
      idRol = Number(rol['id_rol'] ?? rol['id']);
      nombreRol = String(rol['nombre'] ?? rol['name'] ?? 'Usuario');
    } else {
      idRol = Number(u['id_rol'] ?? u['rol_id']);
      nombreRol = String(u['nombre_rol'] ?? u['rol_nombre'] ?? 'Usuario');
    }

    if (!u['email'] || !idRol || Number.isNaN(idRol)) {
      return null;
    }

    return {
      id_usuario: Number(u['id_usuario'] ?? u['id'] ?? 0),
      nombre: String(u['nombre'] ?? ''),
      apellido: String(u['apellido'] ?? ''),
      direccion: String(u['direccion'] ?? ''),
      telefono: String(u['telefono'] ?? ''),
      email: String(u['email'] ?? ''),
      estado: String(u['estado'] ?? ''),
      rol: { id_rol: idRol, nombre: nombreRol },
    };
  }

  private pickString(data: Record<string, unknown>, keys: string[]): string | undefined {
    for (const key of keys) {
      const value = data[key];
      if (typeof value === 'string' && value) return value;
    }
    return undefined;
  }

  private extractToken(response: LoginResponse): string | null {
    return response.accessToken ?? response.access_token ?? response.token ?? null;
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
      return this.isHtmlResponse(body) ? this.messageForStatus(error.status) : body;
    }

    if (body && typeof body === 'object') {
      if (body.mensaje) return String(body.mensaje);
      if (body.detail) return String(body.detail);
      if (body.message) return String(body.message);

      if (Array.isArray(body.non_field_errors) && body.non_field_errors[0]) {
        return body.non_field_errors[0];
      }

      const fieldError = body.email ?? body.password;
      if (Array.isArray(fieldError) && fieldError[0]) return fieldError[0];
      if (typeof fieldError === 'string') return fieldError;
    }

    return this.messageForStatus(error.status);
  }

  private isHtmlResponse(body: string): boolean {
    const trimmed = body.trim().toLowerCase();
    return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html');
  }

  private messageForStatus(status: number): string {
    if (status === 0) return 'No se pudo conectar con el servidor';
    if (status === 401 || status === 403) return 'Correo o contraseña incorrectos';
    if (status === 404) return 'Ruta no encontrada. Reinicia con npm start para activar el proxy.';
    return 'Error al iniciar sesión';
  }
}
