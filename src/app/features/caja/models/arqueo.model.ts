export interface Arqueo {
  id_arqueo: number;
  id_usuario?: number;
  cajero?: string;
  monto_apertura: number;
  monto_cierre?: number;
  monto_cierre_real?: number;
  monto_efectivo_esperado?: number;
  diferencia?: number;
  observacion?: string;
  estado: string;
  fecha_apertura: string;
  fecha_cierre?: string;
}

export interface AbrirArqueoRequest {
  monto_apertura: number;
  observacion?: string;
}

export interface CerrarArqueoRequest {
  monto_cierre_real: number;
  observacion?: string;
}

export interface ArqueoApiResponse {
  status: boolean;
  body: Arqueo[];
}

export interface ArqueoActivoResponse {
  status: boolean;
  body: Arqueo | null;
}

export interface ArqueoMutationResponse {
  status?: boolean;
  body?: Arqueo;
  mensaje?: string;
  message?: string;
}

export interface ArqueoQueryParams {
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
