import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '../../../../core/services/api.service';
import { extractApiEntity, extractApiList } from '../../../../core/services/api-response.util';
import { parseApiError } from '../../../../core/services/http-error.util';
import {
  ActualizarClienteRequest,
  Cliente,
  ClienteEstado,
  ClienteMutationResponse,
  ClienteQueryParams,
  CrearClienteRequest,
  PaginatedResult,
  TipoDocumento,
  TipoUsuario,
  TIPOS_DOCUMENTO_FALLBACK,
  TIPOS_USUARIO,
} from '../models/cliente.model';

const CLIENTES_ENDPOINT = '/clientes';

@Injectable({ providedIn: 'root' })
export class ClienteService {
  constructor(private api: ApiService) {}

  getClientes(params: ClienteQueryParams = {}): Observable<PaginatedResult<Cliente>> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const search = params.search?.trim() ?? '';
    const tipoUsuario = params.tipoUsuario?.trim().toUpperCase() ?? '';

    const query: Record<string, string> = {
      page: String(page),
      limit: String(pageSize),
    };
    if (search) query['search'] = search;

    return this.api.get<unknown>(CLIENTES_ENDPOINT, query).pipe(
      map((response) => this.toPaginatedResult(response, page, pageSize, search, tipoUsuario)),
      catchError((error) =>
        throwError(() => new Error(parseApiError(error, 'Error al cargar los clientes')))
      )
    );
  }

  getTiposDocumento(): Observable<TipoDocumento[]> {
    return of(TIPOS_DOCUMENTO_FALLBACK);
  }

  crearCliente(payload: CrearClienteRequest): Observable<Cliente> {
    return this.api
      .post<ClienteMutationResponse>(`${CLIENTES_ENDPOINT}/crear`, {
        tipo_usuario: payload.tipo_usuario.trim(),
        tipo_documento: payload.tipo_documento,
        numero_documento: payload.numero_documento.trim(),
        nombre: payload.nombre.trim(),
        apellido: payload.apellido.trim(),
        correo: payload.correo.trim(),
        telefono: payload.telefono.trim(),
        direccion: payload.direccion.trim(),
        ciudad: payload.ciudad.trim(),
        departamento: payload.departamento.trim(),
        pais: payload.pais.trim(),
      })
      .pipe(
        map((response) => this.extractCliente(response, 'No se pudo crear el cliente')),
        catchError((error) =>
          throwError(() => new Error(parseApiError(error, 'Error al crear el cliente')))
        )
      );
  }

  actualizarCliente(id: number, payload: ActualizarClienteRequest): Observable<Cliente> {
    return this.api
      .put<ClienteMutationResponse>(`${CLIENTES_ENDPOINT}/${id}/actualizar`, payload)
      .pipe(
        map((response) => this.extractCliente(response, 'No se pudo actualizar el cliente')),
        catchError((error) =>
          throwError(() => new Error(parseApiError(error, 'Error al actualizar el cliente')))
        )
      );
  }

  cambiarEstado(id: number, nuevoEstado: ClienteEstado): Observable<Cliente> {
    return this.api
      .post<ClienteMutationResponse>(`${CLIENTES_ENDPOINT}/${id}/estado`, {
        estado: nuevoEstado,
      })
      .pipe(
        map((response) => this.extractCliente(response, 'No se pudo actualizar el cliente')),
        catchError((error) =>
          throwError(() => new Error(parseApiError(error, 'Error al cambiar el estado')))
        )
      );
  }

  getEstadoOpuesto(estado: string): ClienteEstado {
    return estado.toLowerCase() === 'activo' ? 'Inactivo' : 'Activo';
  }

  private toPaginatedResult(
    response: unknown,
    page: number,
    pageSize: number,
    search: string,
    tipoUsuario: string
  ): PaginatedResult<Cliente> {
    let items = extractApiList<Cliente>(response, 'No se pudieron cargar los clientes').map(
      (item) => this.normalize(item)
    );

    if (tipoUsuario) {
      items = items.filter((c) => c.tipo_usuario === tipoUsuario);
    }

    if (search) {
      const term = search.toLowerCase();
      items = items.filter(
        (c) =>
          c.nombre.toLowerCase().includes(term) ||
          c.apellido.toLowerCase().includes(term) ||
          c.correo.toLowerCase().includes(term) ||
          c.numero_documento.toLowerCase().includes(term) ||
          c.telefono.toLowerCase().includes(term) ||
          c.estado.toLowerCase().includes(term) ||
          c.tipo_usuario.toLowerCase().includes(term) ||
          String(c.tipo_documento).includes(term)
      );
    }

    const total = items.length;
    const start = (page - 1) * pageSize;
    return { items: items.slice(start, start + pageSize), total, page, pageSize };
  }

  private extractCliente(response: ClienteMutationResponse | Cliente, fallback: string): Cliente {
    if ('id_cliente' in response) return this.normalize(response);
    return this.normalize(extractApiEntity<Cliente>(response, ['body'], fallback));
  }

  private normalize(raw: Cliente): Cliente {
    const tipoRaw = String(raw.tipo_usuario ?? 'CLIENTE').trim().toUpperCase();
    const tipo_usuario = (TIPOS_USUARIO as readonly string[]).includes(tipoRaw)
      ? (tipoRaw as TipoUsuario)
      : 'CLIENTE';

    return {
      id_cliente: Number(raw.id_cliente),
      tipo_usuario,
      tipo_documento: raw.tipo_documento,
      numero_documento: String(raw.numero_documento ?? ''),
      nombre: String(raw.nombre ?? ''),
      apellido: String(raw.apellido ?? ''),
      correo: String(raw.correo ?? ''),
      telefono: String(raw.telefono ?? ''),
      direccion: String(raw.direccion ?? ''),
      ciudad: String(raw.ciudad ?? ''),
      departamento: String(raw.departamento ?? ''),
      pais: String(raw.pais ?? ''),
      estado: String(raw.estado ?? ''),
      fecha_creacion: raw.fecha_creacion ? String(raw.fecha_creacion) : undefined,
      fecha_actualizacion: raw.fecha_actualizacion ? String(raw.fecha_actualizacion) : undefined,
    };
  }
}
