/** Lo que envía el formulario al backend */
export interface LoginApiPayload {
  email: string;
  password: string;
}

/** Lo que recibe el componente de login */
export interface LoginRequest extends LoginApiPayload {
  rememberMe?: boolean;
}

/** Respuesta del POST /auth/login/ (soporta distintos formatos del backend) */
export interface AuthResponse {
  accessToken?: string;
  access?: string;
  access_token?: string;
  token?: string;
  refresh?: string;
  refresh_token?: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}
