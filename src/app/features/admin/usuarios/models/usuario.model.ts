export interface Rol {
  id_rol: number;
  nombre: string;
}

export interface Usuario {
  id_usuario: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  direccion: string;
  estado: string;
  rol: Rol;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

export type UsuarioEstado = 'Activo' | 'Inactivo';

export interface CrearUsuarioRequest {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  telefono: string;
  direccion: string;
  id_rol: number;
}

export interface ActualizarUsuarioRequest {
  nombre: string;
  apellido: string;
  telefono: string;
  direccion: string;
  id_rol: number;
}

export interface CambiarEstadoUsuarioRequest {
  nuevo_estado: UsuarioEstado;
}

export interface UsuarioApiResponse {
  ok?: boolean;
  status?: boolean;
  usuarios?: Usuario[];
  body?: Usuario[];
  mensaje?: string;
}

export interface RolApiResponse {
  status: boolean;
  body: Rol[];
}

export interface UsuarioMutationResponse {
  ok?: boolean;
  status?: boolean;
  usuario?: Usuario;
  body?: Usuario;
  mensaje?: string;
  message?: string;
}

export interface UsuarioQueryParams {
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
