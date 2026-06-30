import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '../../../../core/services/api.service';
import { extractApiList } from '../../../../core/services/api-response.util';
import { parseApiError } from '../../../../core/services/http-error.util';
import {
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

    return this.api.get<unknown>(MOVIMIENTOS_ENDPOINT).pipe(
      map((response) => this.toPaginatedResult(response, page, pageSize, search, tipo)),
      catchError((error) =>
        throwError(() => new Error(parseApiError(error, 'Error al cargar los movimientos')))
      )
    );
  }

  private toPaginatedResult(
    response: unknown,
    page: number,
    pageSize: number,
    search: string,
    tipo: string
  ): PaginatedResult<MovimientoInventario> {
    let items = extractApiList<unknown>(response, 'No se pudieron cargar los movimientos').map(
      (item) => this.normalize(item)
    );

    if (tipo) {
      items = items.filter((m) => m.tipo_movimiento.toUpperCase() === tipo.toUpperCase());
    }

    if (search) {
      const term = search.toLowerCase();
      items = items.filter(
        (m) =>
          (m.nombre_insumo ?? '').toLowerCase().includes(term) ||
          (m.nombre_producto ?? '').toLowerCase().includes(term) ||
          m.tipo_movimiento.toLowerCase().includes(term) ||
          m.motivo.toLowerCase().includes(term) ||
          (m.nombre_usuario ?? '').toLowerCase().includes(term)
      );
    }

    const total = items.length;
    const start = (page - 1) * pageSize;
    return { items: items.slice(start, start + pageSize), total, page, pageSize };
  }

  private normalize(raw: unknown): MovimientoInventario {
    const item = (raw ?? {}) as Record<string, unknown>;
    const nombreInsumo = String(item['nombre_insumo'] ?? item['insumo_nombre'] ?? '').trim();
    const nombreUsuario = String(item['nombre_usuario'] ?? item['usuario'] ?? '').trim();
    const nombreProducto = String(item['nombre_producto'] ?? item['producto_nombre'] ?? '').trim();
    const fecha = String(item['fecha_creacion'] ?? item['fecha_movimiento'] ?? '').trim();
    const idProductoRaw = item['id_producto'];

    return {
      id_movimiento: Number(item['id_movimiento']),
      id_insumo: Number(item['id_insumo']),
      nombre_insumo: nombreInsumo || undefined,
      id_producto: idProductoRaw != null && idProductoRaw !== '' ? Number(idProductoRaw) : undefined,
      nombre_producto: nombreProducto || undefined,
      tipo_movimiento: String(item['tipo_movimiento'] ?? ''),
      cantidad: Number(item['cantidad'] ?? 0),
      motivo: String(item['motivo'] ?? ''),
      nombre_usuario: nombreUsuario || undefined,
      fecha_creacion: fecha,
    };
  }
}
