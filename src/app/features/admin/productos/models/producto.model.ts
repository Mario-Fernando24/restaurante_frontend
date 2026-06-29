export type TipoProducto = 'PREPARADO' | 'VENTA_DIRECTA';

export interface Producto {
  id_producto: number;
  id_categoria: number;
  categoria_nombre?: string;
  nombre: string;
  descripcion: string;
  precio_venta: number;
  tipo_producto: TipoProducto | string;
  imagen?: string;
  estado: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

export type ProductoEstado = 'Activo' | 'Inactivo';

export interface CrearProductoRequest {
  id_categoria: number;
  nombre: string;
  descripcion: string;
  precio_venta: number;
  tipo_producto: TipoProducto;
  imagen_base64?: string;
}

export interface ActualizarProductoRequest {
  id_categoria?: number;
  nombre?: string;
  descripcion?: string;
  precio_venta?: number;
  tipo_producto?: TipoProducto;
  imagen_base64?: string;
  eliminar_imagen?: boolean;
  estado?: ProductoEstado;
}

export interface ProductoApiResponse {
  status: boolean;
  body: Producto[];
}

export interface ProductoMutationResponse {
  status?: boolean;
  body?: Producto;
  mensaje?: string;
  message?: string;
}

export interface ProductoQueryParams {
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

export const TIPOS_PRODUCTO: TipoProducto[] = ['PREPARADO', 'VENTA_DIRECTA'];
