export interface MovimientoInventario {
  id_movimiento: number;
  id_insumo: number;
  nombre_insumo?: string;
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
