export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}
