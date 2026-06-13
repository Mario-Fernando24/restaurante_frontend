import { Injectable } from '@angular/core';

const TOKEN_KEY = 'caucasia_access_token';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  // Si rememberMe es true guarda en localStorage, si no en sessionStorage
  saveToken(token: string, rememberMe = false): void {
    this.clearToken();
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
  }

  clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  }
}
