import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

// Uso: canActivate: [roleGuard(['admin', 'cajero'])]
export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const router = inject(Router);
    const userRole = 'admin'; // TODO: obtener del usuario logueado

    return allowedRoles.includes(userRole)
      ? true
      : router.createUrlTree(['/auth/login']);
  };
};
