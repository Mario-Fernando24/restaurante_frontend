/** Lo que envía el formulario al backend */
export interface LoginApiPayload {
  email: string;
  password: string;
}

/** Lo que recibe el componente de login */
export interface LoginRequest extends LoginApiPayload {
  rememberMe?: boolean;
}

export interface Rol {
  id_rol: number;
  nombre: string;
}

export interface Usuario {
  id_usuario: number;
  nombre: string;
  apellido: string;
  direccion: string;
  telefono: string;
  email: string;
  estado: string;
  rol: Rol;
}

/** Respuesta del POST /auth/login */
export interface LoginResponse {
  ok: boolean;
  mensaje: string;
  usuario: Usuario;
  /** Por si el backend agrega JWT más adelante */
  accessToken?: string;
  access_token?: string;
  token?: string;
}
