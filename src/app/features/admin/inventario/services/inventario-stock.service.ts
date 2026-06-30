import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '../../../../core/services/api.service';
import { extractApiEntity } from '../../../../core/services/api-response.util';
import { parseApiError } from '../../../../core/services/http-error.util';
import { StockInsumoItem, StockPorCategoriaReport } from '../models/stock.model';

const STOCK_ENDPOINT = '/inventario/stock-por-categoria';

@Injectable({ providedIn: 'root' })
export class InventarioStockService {
  constructor(private api: ApiService) {}

  getStockPorCategoria(): Observable<StockPorCategoriaReport> {
    return this.api.get<unknown>(STOCK_ENDPOINT).pipe(
      map((response) =>
        this.normalize(
          extractApiEntity<unknown>(response, ['body'], 'No se pudo cargar el inventario')
        )
      ),
      catchError((error) =>
        throwError(() => new Error(parseApiError(error, 'Error al cargar el inventario')))
      )
    );
  }

  private normalize(raw: unknown): StockPorCategoriaReport {
    const data = (raw ?? {}) as Record<string, unknown>;

    return {
      fecha_consulta: String(data['fecha_consulta'] ?? ''),
      total_insumos: Number(data['total_insumos'] ?? 0),
      categorias: this.normalizeGrupos(data['categorias']),
      sin_categoria: this.normalizeInsumos(data['sin_categoria']),
    };
  }

  private normalizeGrupos(value: unknown): StockPorCategoriaReport['categorias'] {
    if (!Array.isArray(value)) return [];

    return value.map((item) => {
      const grupo = (item ?? {}) as Record<string, unknown>;
      return {
        id_categoria: Number(grupo['id_categoria'] ?? 0),
        nombre: String(grupo['nombre'] ?? 'Sin nombre'),
        total_insumos: Number(grupo['total_insumos'] ?? 0),
        insumos: this.normalizeInsumos(grupo['insumos']),
      };
    });
  }

  private normalizeInsumos(value: unknown): StockInsumoItem[] {
    if (!Array.isArray(value)) return [];

    return value.map((item) => {
      const insumo = (item ?? {}) as Record<string, unknown>;
      return {
        id_insumo: Number(insumo['id_insumo'] ?? 0),
        nombre: String(insumo['nombre'] ?? ''),
        unidad_medida: String(insumo['unidad_medida'] ?? ''),
        stock_actual: Number(insumo['stock_actual'] ?? 0),
        stock_minimo: Number(insumo['stock_minimo'] ?? 0),
        stock_bajo: Boolean(insumo['stock_bajo']),
      };
    });
  }
}
