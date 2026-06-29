import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '../../../../core/services/api.service';
import { parseApiError } from '../../../../core/services/http-error.util';
import {
  ActualizarRecetaRequest,
  CrearRecetaRequest,
  PaginatedResult,
  Receta,
  RecetaApiResponse,
  RecetaMutationResponse,
  RecetaQueryParams,
} from '../models/receta.model';

const RECETAS_ENDPOINT = '/recetas-producto';

@Injectable({ providedIn: 'root' })
export class RecetaService {
  constructor(private api: ApiService) {}

  getRecetas(params: RecetaQueryParams = {}): Observable<PaginatedResult<Receta>> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const search = params.search?.trim() ?? '';

    const query: Record<string, string> = {
      page: String(page),
      limit: String(pageSize),
    };
    if (search) query['search'] = search;

    return this.api.get<RecetaApiResponse>(RECETAS_ENDPOINT, query).pipe(
      map((response) => this.toPaginatedResult(response, page, pageSize, search)),
      catchError((error) =>
        throwError(() => new Error(parseApiError(error, 'Error al cargar las recetas')))
      )
    );
  }

  crearReceta(payload: CrearRecetaRequest): Observable<Receta> {
    return this.api
      .post<RecetaMutationResponse>(`${RECETAS_ENDPOINT}/crear`, {
        id_producto: payload.id_producto,
        id_insumo: payload.id_insumo,
        cantidad_usada: payload.cantidad_usada,
      })
      .pipe(
        map((response) => this.extractReceta(response, 'No se pudo crear la receta')),
        catchError((error) =>
          throwError(() => new Error(parseApiError(error, 'Error al crear la receta')))
        )
      );
  }

  actualizarReceta(id: number, payload: ActualizarRecetaRequest): Observable<Receta> {
    return this.api
      .put<RecetaMutationResponse>(`${RECETAS_ENDPOINT}/${id}/actualizar`, {
        id_producto: payload.id_producto,
        id_insumo: payload.id_insumo,
        cantidad_usada: payload.cantidad_usada,
      })
      .pipe(
        map((response) => this.extractReceta(response, 'No se pudo actualizar la receta')),
        catchError((error) =>
          throwError(() => new Error(parseApiError(error, 'Error al actualizar la receta')))
        )
      );
  }

  private toPaginatedResult(
    response: RecetaApiResponse,
    page: number,
    pageSize: number,
    search: string
  ): PaginatedResult<Receta> {
    if (!response?.status || !Array.isArray(response.body)) {
      throw new Error('No se pudieron cargar las recetas');
    }

    let items = response.body.map((item) => this.normalize(item));

    if (search) {
      const term = search.toLowerCase();
      items = items.filter(
        (r) =>
          (r.nombre_producto ?? '').toLowerCase().includes(term) ||
          (r.nombre_insumo ?? '').toLowerCase().includes(term)
      );
    }

    const total = items.length;
    const start = (page - 1) * pageSize;
    return { items: items.slice(start, start + pageSize), total, page, pageSize };
  }

  private extractReceta(response: RecetaMutationResponse | Receta, fallback: string): Receta {
    if ('id_receta' in response) return this.normalize(response);
    if (response?.status === false) {
      throw new Error(String(response.mensaje ?? response.message ?? fallback));
    }
    if (response?.body) return this.normalize(response.body);
    throw new Error(String(response?.mensaje ?? response?.message ?? fallback));
  }

  private normalize(raw: unknown): Receta {
    const item = (raw ?? {}) as Record<string, unknown>;
    return {
      id_receta: Number(item['id_receta']),
      id_producto: Number(item['id_producto']),
      id_insumo: Number(item['id_insumo']),
      nombre_producto: item['nombre_producto']
        ? String(item['nombre_producto'])
        : item['producto_nombre']
          ? String(item['producto_nombre'])
          : undefined,
      nombre_insumo: item['nombre_insumo']
        ? String(item['nombre_insumo'])
        : item['insumo_nombre']
          ? String(item['insumo_nombre'])
          : undefined,
      cantidad_usada: Number(item['cantidad_usada'] ?? 0),
      fecha_creacion: item['fecha_creacion'] ? String(item['fecha_creacion']) : undefined,
    };
  }
}
