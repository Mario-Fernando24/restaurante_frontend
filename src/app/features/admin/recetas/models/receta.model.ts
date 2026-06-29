export interface RecetaLinea {
  id_receta: number;
  id_insumo: number;
  nombreInsumo: string;
  cantidad_usada: number;
  cantidadLabel: string;
  unidad_medida: string;
  costoUnitario: number;
  costoInsumo: number;
  costoDetalle: string;
}

export interface RecetaGrupo {
  id_producto: number;
  nombreProducto: string;
  precioVenta: number;
  costoTotal: number;
  ganancia: number;
  margenPorcentaje: number | null;
  lineas: RecetaLinea[];
}

export interface ActualizarRecetaRequest {
  id_producto: number;
  id_insumo: number;
  cantidad_usada: number;
}

export interface Receta {
  id_receta: number;
  id_producto: number;
  id_insumo: number;
  nombre_producto?: string;
  nombre_insumo?: string;
  cantidad_usada: number;
  fecha_creacion?: string;
}

export interface CrearRecetaRequest {
  id_producto: number;
  id_insumo: number;
  cantidad_usada: number;
}

export interface RecetaApiResponse {
  status: boolean;
  body: Receta[];
}

export interface RecetaMutationResponse {
  status?: boolean;
  body?: Receta;
  mensaje?: string;
  message?: string;
}

export interface RecetaQueryParams {
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
