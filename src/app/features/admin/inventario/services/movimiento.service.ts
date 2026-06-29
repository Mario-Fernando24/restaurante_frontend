import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '../../../../core/services/api.service';
import { parseApiError } from '../../../../core/services/http-error.util';
import {
  MovimientoApiResponse,
  MovimientoInventario,
  MovimientoQueryParams,
  PaginatedResult,
} from '../models/movimiento.model';

const MOVIMIENTOS_ENDPOINT = '/movimientos-inventario';

@Injectable({ providedIn: 'root' })
export class MovimientoService {
  constructor(private api: ApiService) {}

  getMovimientos(params: MovimientoQueryParams = {}): Observable<PaginatedResult<MovimientoInventario>> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const search = params.search?.trim() ?? '';
    const tipo = params.tipo?.trim() ?? '';

    const query: Record<string, string> = {
      page: String(page),
      limit: String(pageSize),
    };
    if (search) query['search'] = search;
    if (tipo) query['tipo'] = tipo;

    return this.api.get<MovimientoApiResponse>(MOVIMIENTOS_ENDPOINT, query).pipe(
      map((response) => this.toPaginatedResult(response, page, pageSize, search, tipo)),
      catchError((error) =>
        throwError(() => new Error(parseApiError(error, 'Error al cargar movimientos')))
      )
    );
  }

  private toPaginatedResult(
    response: MovimientoApiResponse,
    page: number,
    pageSize: number,
    search: string,
    tipo: string
  ): PaginatedResult<MovimientoInventario> {
    if (!response?.status || !Array.isArray(response.body)) {
      throw new Error('No se pudieron cargar los movimientos');
    }

    let items = response.body.map((item) => this.normalize(item));

    if (tipo) {
      items = items.filter((m) => m.tipo_movimiento.toUpperCase() === tipo.toUpperCase());
    }

    if (search) {
      const term = search.toLowerCase();
      items = items.filter(
        (m) =>
          (m.nombre_insumo ?? '').toLowerCase().includes(term) ||
          m.tipo_movimiento.toLowerCase().includes(term) ||
          m.motivo.toLowerCase().includes(term) ||
          (m.nombre_usuario ?? '').toLowerCase().includes(term)
      );
    }

    const total = items.length;
    const start = (page - 1) * pageSize;
    return { items: items.slice(start, start + pageSize), total, page, pageSize };
  }

  private normalize(raw: MovimientoInventario): MovimientoInventario {
    return {
      id_movimiento: Number(raw.id_movimiento),
      id_insumo: Number(raw.id_insumo),
      nombre_insumo: raw.nombre_insumo ? String(raw.nombre_insumo) : undefined,
      tipo_movimiento: String(raw.tipo_movimiento ?? ''),
      cantidad: Number(raw.cantidad ?? 0),
      motivo: String(raw.motivo ?? ''),
      nombre_usuario: raw.nombre_usuario ? String(raw.nombre_usuario) : undefined,
      fecha_creacion: String(raw.fecha_creacion ?? ''),
    };
  }
}
