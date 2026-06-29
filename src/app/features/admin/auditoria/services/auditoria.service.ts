import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '../../../../core/services/api.service';
import { parseApiError } from '../../../../core/services/http-error.util';
import {
  AuditoriaApiResponse,
  AuditoriaQueryParams,
  AuditoriaRegistro,
  PaginatedResult,
} from '../models/auditoria.model';

const AUDITORIA_ENDPOINT = '/auditoria';

@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  constructor(private api: ApiService) {}

  getAuditoria(params: AuditoriaQueryParams = {}): Observable<PaginatedResult<AuditoriaRegistro>> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const search = params.search?.trim() ?? '';
    const modulo = params.modulo?.trim() ?? '';

    const query: Record<string, string> = {
      page: String(page),
      limit: String(pageSize),
    };
    if (search) query['search'] = search;
    if (modulo) query['modulo'] = modulo;

    return this.api.get<AuditoriaApiResponse>(AUDITORIA_ENDPOINT, query).pipe(
      map((response) => this.toPaginatedResult(response, page, pageSize, search, modulo)),
      catchError((error) =>
        throwError(() => new Error(parseApiError(error, 'Error al cargar auditoría')))
      )
    );
  }

  private toPaginatedResult(
    response: AuditoriaApiResponse,
    page: number,
    pageSize: number,
    search: string,
    modulo: string
  ): PaginatedResult<AuditoriaRegistro> {
    if (!response?.status || !Array.isArray(response.body)) {
      throw new Error('No se pudieron cargar los registros de auditoría');
    }

    let items = response.body.map((item) => this.normalize(item));

    if (modulo) {
      items = items.filter((a) => a.modulo.toLowerCase() === modulo.toLowerCase());
    }

    if (search) {
      const term = search.toLowerCase();
      items = items.filter(
        (a) =>
          a.modulo.toLowerCase().includes(term) ||
          a.accion.toLowerCase().includes(term) ||
          a.tabla_afectada.toLowerCase().includes(term) ||
          (a.nombre_usuario ?? '').toLowerCase().includes(term)
      );
    }

    const total = items.length;
    const start = (page - 1) * pageSize;
    return { items: items.slice(start, start + pageSize), total, page, pageSize };
  }

  private normalize(raw: AuditoriaRegistro): AuditoriaRegistro {
    return {
      id_auditoria: Number(raw.id_auditoria),
      fecha: String(raw.fecha ?? ''),
      nombre_usuario: raw.nombre_usuario ? String(raw.nombre_usuario) : undefined,
      modulo: String(raw.modulo ?? ''),
      accion: String(raw.accion ?? ''),
      tabla_afectada: String(raw.tabla_afectada ?? ''),
      id_registro: raw.id_registro,
    };
  }
}
