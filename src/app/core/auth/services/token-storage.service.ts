import { Injectable } from '@angular/core';

const TOKEN_KEY = 'access_token';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  // Si rememberMe es true guarda en localStorage, si no en sessionStorage
  // Antes de guardar un nuevo token, eliminamos cualquier token existente para evitar confusiones
  saveToken(token: string, rememberMe = false): void {
    this.clearToken();
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(TOKEN_KEY, token);
  }

  // Intenta obtener el token de localStorage primero, si no está, intenta en sessionStorage
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
  }

  // Elimina el token de ambos storages para asegurar que se borre sin importar dónde se guardó
  clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  }
}
