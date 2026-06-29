export interface AuditoriaRegistro {
  id_auditoria: number;
  fecha: string;
  nombre_usuario?: string;
  modulo: string;
  accion: string;
  tabla_afectada: string;
  id_registro: number | string;
}

export interface AuditoriaApiResponse {
  status: boolean;
  body: AuditoriaRegistro[];
}

export interface AuditoriaQueryParams {
  search?: string;
  modulo?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
