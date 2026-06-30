export interface MovimientoLinea {
  id_movimiento: number;
  nombreInsumo: string;
  cantidad: number;
  cantidadLabel: string;
}

export interface MovimientoProductoGrupo {
  nombreProducto: string;
  lineas: MovimientoLinea[];
}

export interface MovimientoGrupo {
  id: string;
  titulo: string;
  subtitulo: string;
  tipo_movimiento: string;
  esVenta: boolean;
  nombre_usuario?: string;
  fecha: string;
  /** Agrupación por producto vendido (solo ventas). */
  productos: MovimientoProductoGrupo[];
  /** Líneas planas para movimientos que no son ventas. */
  lineas: MovimientoLinea[];
}

export interface MovimientoInventario {
  id_movimiento: number;
  id_insumo: number;
  nombre_insumo?: string;
  id_producto?: number;
  nombre_producto?: string;
  tipo_movimiento: string;
  cantidad: number;
  motivo: string;
  nombre_usuario?: string;
  fecha_creacion: string;
}

export interface MovimientoApiResponse {
  status: boolean;
  body: MovimientoInventario[];
}

export interface MovimientoQueryParams {
  search?: string;
  tipo?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const TIPOS_MOVIMIENTO = ['ENTRADA', 'SALIDA', 'AJUSTE'] as const;
