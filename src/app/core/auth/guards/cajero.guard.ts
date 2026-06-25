import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ROLE_ADMIN } from '../constants/roles';
import { ROUTES } from '../../routing/route-paths';
import { AuthService } from '../services/auth.service';

/**
 * Protege el panel del cajero.
 * - Sin sesión → login
 * - Si es admin → lo manda a /admin (su panel correcto)
 */
export const cajeroGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.getCurrentUser();

  if (!user?.rol?.id_rol) {
    return router.createUrlTree([ROUTES.LOGIN]);
  }

  if (Number(user.rol.id_rol) === ROLE_ADMIN) {
    return router.createUrlTree([ROUTES.ADMIN]);
  }

  return true;
};
