export interface TipoDocumento {
  codigo: number;
  nombre: string;
}

export interface Cliente {
  id_cliente: number;
  tipo_usuario: string;
  tipo_documento: number | string;
  numero_documento: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  pais: string;
  estado: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

export type ClienteEstado = 'Activo' | 'Inactivo';

export interface CrearClienteRequest {
  tipo_usuario: string;
  tipo_documento: number;
  numero_documento: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  pais: string;
}

export interface ActualizarClienteRequest {
  nombre?: string;
  apellido?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  departamento?: string;
  pais?: string;
  correo?: string;
  estado?: ClienteEstado;
}

export interface ClienteApiResponse {
  status: boolean;
  body: Cliente[];
}

export interface TipoDocumentoApiResponse {
  status: boolean;
  body: TipoDocumento[];
}

export interface ClienteMutationResponse {
  status?: boolean;
  body?: Cliente;
  mensaje?: string;
  message?: string;
}

export interface ClienteQueryParams {
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

export const TIPOS_USUARIO = ['Natural', 'Juridico'] as const;

/** Códigos DIAN según Postman: 301=Cédula · 302=T.I. · 303=NIT · 304=Pasaporte */
export const TIPOS_DOCUMENTO_FALLBACK: TipoDocumento[] = [
  { codigo: 301, nombre: 'Cédula de ciudadanía' },
  { codigo: 302, nombre: 'Tarjeta de identidad' },
  { codigo: 303, nombre: 'NIT' },
  { codigo: 304, nombre: 'Pasaporte' },
];
