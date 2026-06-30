import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '../../../../core/services/api.service';
import { extractApiEntity, extractApiList } from '../../../../core/services/api-response.util';
import { parseApiError } from '../../../../core/services/http-error.util';
import {
  CompraDetalleLinea,
  CompraDetalleResponse,
  CompraListItem,
  CompraMovimiento,
  CompraMovimientoDetalle,
  CompraQueryParams,
  CompraRegistrada,
  CompraResumen,
  PaginatedCompras,
  RegistrarCompraRequest,
  RegistrarCompraResponse,
} from '../models/compra.model';

const COMPRAS_ENDPOINT = '/inventario/compras';

@Injectable({ providedIn: 'root' })
export class CompraInventarioService {
  constructor(private api: ApiService) {}

  getCompras(params: CompraQueryParams = {}): Observable<PaginatedCompras> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const search = params.search?.trim() ?? '';

    const query: Record<string, string> = {};
    if (search) query['search'] = search;

    return this.api.get<unknown>(COMPRAS_ENDPOINT, query).pipe(
      map((response) => {
        const items = extractApiList<unknown>(response).map((item) =>
          this.normalizeListItem(item)
        );
        return this.paginate(items, page, pageSize, search);
      }),
      catchError((error) =>
        throwError(() => new Error(parseApiError(error, 'Error al cargar las compras')))
      )
    );
  }

  getCompraDetalle(idCompra: number): Observable<CompraDetalleResponse> {
    return this.api.get<unknown>(`${COMPRAS_ENDPOINT}/${idCompra}`).pipe(
      map((response) => {
        const body = extractApiEntity<Record<string, unknown>>(
          response,
          ['body'],
          'No se pudo cargar el detalle de la compra'
        );
        const compraRaw = (body['compra'] ?? {}) as Record<string, unknown>;
        const movimientos = Array.isArray(body['movimientos']) ? body['movimientos'] : [];

        return {
          compra: this.normalizeCompra(compraRaw, []),
          movimientos: movimientos.map((item) => this.normalizeMovimientoDetalle(item)),
        };
      }),
      catchError((error) =>
        throwError(() => new Error(parseApiError(error, 'Error al cargar el detalle de la compra')))
      )
    );
  }

  registrarCompra(payload: RegistrarCompraRequest): Observable<RegistrarCompraResponse> {
    return this.api.post<unknown>(COMPRAS_ENDPOINT, payload).pipe(
      map((response) =>
        this.normalize(
          extractApiEntity<unknown>(response, ['body'], 'No se pudo registrar la compra')
        )
      ),
      catchError((error) =>
        throwError(() => new Error(parseApiError(error, 'Error al registrar la compra')))
      )
    );
  }

  private paginate(
    items: CompraListItem[],
    page: number,
    pageSize: number,
    search: string
  ): PaginatedCompras {
    const filtered = search
      ? items.filter((item) => {
          const term = search.toLowerCase();
          return (
            String(item.id_compra).includes(term) ||
            (item.proveedor_nombre ?? '').toLowerCase().includes(term) ||
            (item.observacion ?? '').toLowerCase().includes(term)
          );
        })
      : items;

    const start = (page - 1) * pageSize;
    return {
      items: filtered.slice(start, start + pageSize),
      total: filtered.length,
      page,
      pageSize,
    };
  }

  private normalize(raw: unknown): RegistrarCompraResponse {
    const data = (raw ?? {}) as Record<string, unknown>;
    const movimientos = Array.isArray(data['movimientos']) ? data['movimientos'] : [];
    const detalle = Array.isArray(data['detalle']) ? data['detalle'] : [];
    const resumenRaw = (data['resumen'] ?? {}) as Record<string, unknown>;
    const compraRaw = (data['compra'] ?? {}) as Record<string, unknown>;

    return {
      compra: this.normalizeCompra(compraRaw, detalle as CompraDetalleLinea[]),
      movimientos: movimientos.map((item) => {
        const mov = (item ?? {}) as Record<string, unknown>;
        return {
          id_movimiento: Number(mov['id_movimiento'] ?? 0),
          id_insumo: Number(mov['id_insumo'] ?? 0),
          insumo_nombre: mov['insumo_nombre'] ? String(mov['insumo_nombre']) : undefined,
          cantidad: Number(mov['cantidad'] ?? 0),
          motivo: String(mov['motivo'] ?? ''),
        } satisfies CompraMovimiento;
      }),
      detalle: detalle as CompraDetalleLinea[],
      resumen: {
        total_costo: String(resumenRaw['total_costo'] ?? '0'),
        total_venta_potencial: String(resumenRaw['total_venta_potencial'] ?? '0'),
        utilidad_potencial: String(resumenRaw['utilidad_potencial'] ?? '0'),
      } satisfies CompraResumen,
    };
  }

  private normalizeListItem(raw: unknown): CompraListItem {
    const item = (raw ?? {}) as Record<string, unknown>;
    return {
      id_compra: Number(item['id_compra'] ?? 0),
      id_proveedor: item['id_proveedor'] == null ? null : Number(item['id_proveedor']),
      proveedor_nombre: item['proveedor_nombre'] ? String(item['proveedor_nombre']) : null,
      observacion: item['observacion'] ? String(item['observacion']) : undefined,
      factura_url: item['factura_url'] ? String(item['factura_url']) : null,
      total_costo: String(item['total_costo'] ?? '0'),
      total_venta_potencial: String(item['total_venta_potencial'] ?? '0'),
      utilidad_potencial: String(item['utilidad_potencial'] ?? '0'),
      registrado_por: item['registrado_por'] ? String(item['registrado_por']) : null,
      fecha_compra: String(item['fecha_compra'] ?? ''),
      total_lineas: Number(item['total_lineas'] ?? 0),
      tiene_factura: Boolean(item['tiene_factura']),
    };
  }

  private normalizeCompra(
    compra: Record<string, unknown>,
    detalle: CompraDetalleLinea[]
  ): CompraRegistrada {
    return {
      id_compra: Number(compra['id_compra'] ?? 0),
      id_proveedor: compra['id_proveedor'] == null ? null : Number(compra['id_proveedor']),
      proveedor_nombre: compra['proveedor_nombre'] ? String(compra['proveedor_nombre']) : null,
      observacion: compra['observacion'] ? String(compra['observacion']) : undefined,
      factura_url: compra['factura_url'] ? String(compra['factura_url']) : null,
      detalle: (Array.isArray(compra['detalle']) ? compra['detalle'] : detalle) as CompraDetalleLinea[],
      total_costo: String(compra['total_costo'] ?? '0'),
      total_venta_potencial: String(compra['total_venta_potencial'] ?? '0'),
      utilidad_potencial: String(compra['utilidad_potencial'] ?? '0'),
      registrado_por: compra['registrado_por'] ? String(compra['registrado_por']) : null,
      fecha_compra: String(compra['fecha_compra'] ?? new Date().toISOString()),
    };
  }

  private normalizeMovimientoDetalle(raw: unknown): CompraMovimientoDetalle {
    const mov = (raw ?? {}) as Record<string, unknown>;
    return {
      id_movimiento: Number(mov['id_movimiento'] ?? 0),
      id_insumo: Number(mov['id_insumo'] ?? 0),
      insumo_nombre: mov['insumo_nombre'] ? String(mov['insumo_nombre']) : undefined,
      id_producto: mov['id_producto'] == null ? null : Number(mov['id_producto']),
      producto_nombre: mov['producto_nombre'] ? String(mov['producto_nombre']) : null,
      tipo_movimiento: String(mov['tipo_movimiento'] ?? ''),
      cantidad: String(mov['cantidad'] ?? '0'),
      motivo: String(mov['motivo'] ?? ''),
      usuario: mov['usuario'] ? String(mov['usuario']) : null,
      fecha_movimiento: String(mov['fecha_movimiento'] ?? ''),
    };
  }
}
