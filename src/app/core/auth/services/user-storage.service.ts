import { Injectable } from '@angular/core';
import { Usuario } from '../models/auth.models';

const USER_KEY = 'usuario_local_storage';

@Injectable({ providedIn: 'root' })
export class UserStorageService {

  saveUser(user: Usuario, rememberMe = false): void {
    this.clearUser();
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(USER_KEY, JSON.stringify(user));
  }

  getUser(): Usuario | null {
    const raw =
      localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as Usuario;
    } catch {
      return null;
    }
  }

  clearUser(): void {
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(USER_KEY);
  }
}
