import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { getDefaultRouteByRole, ROUTES } from '../../routing/route-paths';
import { AuthService } from '../services/auth.service';

/**
 * Permite el acceso solo a los roles indicados.
 * Si el usuario tiene otro rol, lo redirige a su panel correspondiente.
 */
export const roleGuard = (allowedRoleIds: number[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const user = auth.getCurrentUser();

    if (!user?.rol?.id_rol) {
      return router.createUrlTree([ROUTES.LOGIN]);
    }

    const roleId = Number(user.rol.id_rol);
    const allowed = allowedRoleIds.map(Number);

    if (allowed.includes(roleId)) {
      return true;
    }

    return router.createUrlTree([getDefaultRouteByRole(roleId)]);
  };
};
