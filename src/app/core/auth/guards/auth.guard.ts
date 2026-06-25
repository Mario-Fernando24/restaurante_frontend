import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ROUTES } from '../../routing/route-paths';
import { AuthService } from '../services/auth.service';

/** Bloquea rutas privadas si no hay sesión activa. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isAuthenticated()
    ? true
    : router.createUrlTree([ROUTES.LOGIN]);
};
