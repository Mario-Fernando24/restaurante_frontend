export interface Categoria {
  id_categoria: number;
  nombre: string;
  descripcion: string;
  estado: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface CategoriaApiResponse {
  status: boolean;
  body: Categoria[];
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
