import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '../../../../core/services/api.service';
import { extractApiEntity, extractApiList } from '../../../../core/services/api-response.util';
import { parseApiError } from '../../../../core/services/http-error.util';
import {
  ActualizarUsuarioRequest,
  CrearUsuarioRequest,
  PaginatedResult,
  Rol,
  Usuario,
  UsuarioEstado,
  UsuarioMutationResponse,
  UsuarioQueryParams,
} from '../models/usuario.model';

const USUARIOS_ENDPOINT = '/usuarios';
const ROLES_ENDPOINT = '/roles';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  constructor(private api: ApiService) {}

  getUsuarios(params: UsuarioQueryParams = {}): Observable<PaginatedResult<Usuario>> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const search = params.search?.trim() ?? '';

    // Backend: GET /api/usuarios → { ok: true, usuarios: [...] }
    return this.api.get<unknown>(USUARIOS_ENDPOINT).pipe(
      map((response) => this.toPaginatedResult(response, page, pageSize, search)),
      catchError((error) =>
        throwError(() => new Error(parseApiError(error, 'Error al cargar los usuarios')))
      )
    );
  }

  getRoles(): Observable<Rol[]> {
    return this.api.get<unknown>(ROLES_ENDPOINT).pipe(
      map((response) =>
        extractApiList<Rol>(response, 'No se pudieron cargar los roles').map((rol) =>
          this.normalizeRol(rol)
        )
      ),
      catchError((error) =>
        throwError(() => new Error(parseApiError(error, 'Error al cargar los roles')))
      )
    );
  }

  crearUsuario(payload: CrearUsuarioRequest): Observable<Usuario> {
    return this.api
      .post<UsuarioMutationResponse>(`${USUARIOS_ENDPOINT}/crear`, {
        nombre: payload.nombre.trim(),
        apellido: payload.apellido.trim(),
        email: payload.email.trim(),
        password: payload.password,
        telefono: payload.telefono.trim(),
        direccion: payload.direccion.trim(),
        id_rol: payload.id_rol,
      })
      .pipe(
        map((response) => this.extractUsuario(response, 'No se pudo crear el usuario')),
        catchError((error) =>
          throwError(() => new Error(parseApiError(error, 'Error al crear el usuario')))
        )
      );
  }

  actualizarUsuario(id: number, payload: ActualizarUsuarioRequest): Observable<Usuario> {
    return this.api
      .put<UsuarioMutationResponse>(`${USUARIOS_ENDPOINT}/${id}/actualizar`, {
        nombre: payload.nombre.trim(),
        apellido: payload.apellido.trim(),
        telefono: payload.telefono.trim(),
        direccion: payload.direccion.trim(),
        id_rol: payload.id_rol,
      })
      .pipe(
        map((response) => this.extractUsuario(response, 'No se pudo actualizar el usuario')),
        catchError((error) =>
          throwError(() => new Error(parseApiError(error, 'Error al actualizar el usuario')))
        )
      );
  }

  cambiarEstado(id: number, nuevoEstado: UsuarioEstado): Observable<Usuario> {
    return this.api
      .post<UsuarioMutationResponse>(`${USUARIOS_ENDPOINT}/${id}/cambiar_estado`, {
        nuevo_estado: nuevoEstado,
      })
      .pipe(
        map((response) => this.extractUsuario(response, 'No se pudo actualizar el usuario')),
        catchError((error) =>
          throwError(() => new Error(parseApiError(error, 'Error al cambiar el estado')))
        )
      );
  }

  getEstadoOpuesto(estado: string): UsuarioEstado {
    return estado.toLowerCase() === 'activo' ? 'Inactivo' : 'Activo';
  }

  private toPaginatedResult(
    response: unknown,
    page: number,
    pageSize: number,
    search: string
  ): PaginatedResult<Usuario> {
    let items = this.extractUsuariosList(response).map((item) => this.normalize(item));

    if (search) {
      const term = search.toLowerCase();
      items = items.filter(
        (u) =>
          u.nombre.toLowerCase().includes(term) ||
          u.apellido.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term) ||
          u.telefono.toLowerCase().includes(term) ||
          u.direccion.toLowerCase().includes(term) ||
          u.estado.toLowerCase().includes(term) ||
          u.rol.nombre.toLowerCase().includes(term)
      );
    }

    const total = items.length;
    const start = (page - 1) * pageSize;
    return { items: items.slice(start, start + pageSize), total, page, pageSize };
  }

  private extractUsuariosList(response: unknown): Usuario[] {
    if (Array.isArray(response)) return response as Usuario[];

    if (!response || typeof response !== 'object') {
      throw new Error('No se pudieron cargar los usuarios');
    }

    const data = response as Record<string, unknown>;

    if (data['ok'] === false || data['status'] === false) {
      throw new Error(String(data['mensaje'] ?? data['message'] ?? 'No se pudieron cargar los usuarios'));
    }

    if (Array.isArray(data['usuarios'])) return data['usuarios'] as Usuario[];
    if (Array.isArray(data['body'])) return data['body'] as Usuario[];

    return extractApiList<Usuario>(response, 'No se pudieron cargar los usuarios');
  }

  private extractUsuario(response: UsuarioMutationResponse | Usuario, fallback: string): Usuario {
    if ('id_usuario' in response) return this.normalize(response);
    return this.normalize(extractApiEntity<Usuario>(response, ['body', 'usuario'], fallback));
  }

  private normalize(raw: Usuario): Usuario {
    const rolRaw = raw.rol as Rol | undefined;

    return {
      id_usuario: Number(raw.id_usuario),
      nombre: String(raw.nombre ?? ''),
      apellido: String(raw.apellido ?? ''),
      email: String(raw.email ?? ''),
      telefono: String(raw.telefono ?? ''),
      direccion: String(raw.direccion ?? ''),
      estado: String(raw.estado ?? ''),
      rol: this.normalizeRol(rolRaw ?? { id_rol: 0, nombre: '' }),
      fecha_creacion: raw.fecha_creacion ? String(raw.fecha_creacion) : undefined,
      fecha_actualizacion: raw.fecha_actualizacion
        ? String(raw.fecha_actualizacion)
        : undefined,
    };
  }

  private normalizeRol(raw: Rol): Rol {
    return {
      id_rol: Number(raw.id_rol),
      nombre: String(raw.nombre ?? ''),
    };
  }
}
