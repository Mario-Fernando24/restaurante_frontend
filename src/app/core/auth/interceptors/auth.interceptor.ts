import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenStorageService } from '../services/token-storage.service';

// Agrega el token a cada petición HTTP si existe
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(TokenStorageService).getToken();

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req);
};
