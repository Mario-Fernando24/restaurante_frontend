export interface Categoria {
  id_categoria: number;
  nombre: string;
  descripcion: string;
  estado: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export type CategoriaEstado = 'Activo' | 'Inactivo';

export interface CambiarEstadoCategoriaRequest {
  nuevo_estado: CategoriaEstado;
}

export interface CategoriaApiResponse {
  status: boolean;
  body: Categoria[];
}

export interface CategoriaMutationResponse {
  status?: boolean;
  body?: Categoria;
  mensaje?: string;
  message?: string;
}

export interface CategoriaQueryParams {
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
