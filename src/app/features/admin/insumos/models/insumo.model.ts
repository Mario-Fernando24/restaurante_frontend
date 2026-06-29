export type UnidadMedida = 'GRAMO' | 'UNIDAD' | 'MILILITRO' | 'LITRO';

export interface Insumo {
  id_insumo: number;
  nombre: string;
  unidad_medida: UnidadMedida | string;
  stock_actual: number;
  stock_minimo: number;
  costo_unitario: number;
  estado: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

export interface CrearInsumoRequest {
  nombre: string;
  unidad_medida: UnidadMedida;
  stock_actual: number;
  stock_minimo: number;
  costo_unitario: number;
}

export interface ActualizarInsumoRequest {
  nombre: string;
  unidad_medida: UnidadMedida;
  stock_actual: number;
  stock_minimo: number;
  costo_unitario: number;
}

export interface InsumoApiResponse {
  status: boolean;
  body: Insumo[];
}

export interface InsumoMutationResponse {
  status?: boolean;
  body?: Insumo;
  mensaje?: string;
  message?: string;
}

export interface InsumoQueryParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const UNIDADES_MEDIDA: UnidadMedida[] = ['GRAMO', 'UNIDAD', 'MILILITRO', 'LITRO'];
