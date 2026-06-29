import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '../../../../core/services/api.service';
import { parseApiError } from '../../../../core/services/http-error.util';
import {
  ActualizarInsumoRequest,
  CrearInsumoRequest,
  Insumo,
  InsumoApiResponse,
  InsumoMutationResponse,
  InsumoQueryParams,
  PaginatedResult,
} from '../models/insumo.model';

const INSUMOS_ENDPOINT = '/insumos';

@Injectable({ providedIn: 'root' })
export class InsumoService {
  constructor(private api: ApiService) {}

  getInsumos(params: InsumoQueryParams = {}): Observable<PaginatedResult<Insumo>> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const search = params.search?.trim() ?? '';

    const query: Record<string, string> = {
      page: String(page),
      limit: String(pageSize),
    };
    if (search) query['search'] = search;

    return this.api.get<InsumoApiResponse>(INSUMOS_ENDPOINT, query).pipe(
      map((response) => this.toPaginatedResult(response, page, pageSize, search)),
      catchError((error) =>
        throwError(() => new Error(parseApiError(error, 'Error al cargar los insumos')))
      )
    );
  }

  crearInsumo(payload: CrearInsumoRequest): Observable<Insumo> {
    return this.api
      .post<InsumoMutationResponse>(`${INSUMOS_ENDPOINT}/crear`, this.toApiBody(payload))
      .pipe(
        map((response) => this.extractInsumo(response, 'No se pudo crear el insumo')),
        catchError((error) =>
          throwError(() => new Error(parseApiError(error, 'Error al crear el insumo')))
        )
      );
  }

  actualizarInsumo(id: number, payload: ActualizarInsumoRequest): Observable<Insumo> {
    return this.api
      .put<InsumoMutationResponse>(`${INSUMOS_ENDPOINT}/${id}/actualizar`, this.toApiBody(payload))
      .pipe(
        map((response) => this.extractInsumo(response, 'No se pudo actualizar el insumo')),
        catchError((error) =>
          throwError(() => new Error(parseApiError(error, 'Error al actualizar el insumo')))
        )
      );
  }

  private toApiBody(payload: CrearInsumoRequest | ActualizarInsumoRequest): Record<string, unknown> {
    return {
      nombre: payload.nombre.trim(),
      unidad_medida: payload.unidad_medida,
      stock_actual: payload.stock_actual,
      stock_minimo: payload.stock_minimo,
      costo_unitario: payload.costo_unitario,
    };
  }

  isStockBajo(insumo: Insumo): boolean {
    return Number(insumo.stock_actual) <= Number(insumo.stock_minimo);
  }

  private toPaginatedResult(
    response: InsumoApiResponse,
    page: number,
    pageSize: number,
    search: string
  ): PaginatedResult<Insumo> {
    if (!response?.status || !Array.isArray(response.body)) {
      throw new Error('No se pudieron cargar los insumos');
    }

    let items = response.body.map((item) => this.normalize(item));

    if (search) {
      const term = search.toLowerCase();
      items = items.filter(
        (i) =>
          i.nombre.toLowerCase().includes(term) ||
          i.unidad_medida.toLowerCase().includes(term) ||
          i.estado.toLowerCase().includes(term)
      );
    }

    const total = items.length;
    const start = (page - 1) * pageSize;
    return { items: items.slice(start, start + pageSize), total, page, pageSize };
  }

  private extractInsumo(response: InsumoMutationResponse | Insumo, fallback: string): Insumo {
    if ('id_insumo' in response) return this.normalize(response);
    if (response?.status === false) {
      throw new Error(String(response.mensaje ?? response.message ?? fallback));
    }
    if (response?.body) return this.normalize(response.body);
    throw new Error(String(response?.mensaje ?? response?.message ?? fallback));
  }

  private normalize(raw: Insumo): Insumo {
    return {
      id_insumo: Number(raw.id_insumo),
      nombre: String(raw.nombre ?? ''),
      unidad_medida: String(raw.unidad_medida ?? ''),
      stock_actual: Number(raw.stock_actual ?? 0),
      stock_minimo: Number(raw.stock_minimo ?? 0),
      costo_unitario: Number(raw.costo_unitario ?? 0),
      estado: String(raw.estado ?? ''),
      fecha_creacion: raw.fecha_creacion ? String(raw.fecha_creacion) : undefined,
      fecha_actualizacion: raw.fecha_actualizacion ? String(raw.fecha_actualizacion) : undefined,
    };
  }
}
