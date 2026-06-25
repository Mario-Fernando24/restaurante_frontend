import { authGuard } from '../auth/guards/auth.guard';
import { cajeroGuard } from '../auth/guards/cajero.guard';
import { roleGuard } from '../auth/guards/role.guard';
import { ROLE_ADMIN } from '../auth/constants/roles';

/**
 * Guards agrupados por área de la app.
 * Así en app-routing queda claro qué protege cada módulo lazy-loaded.
 */

/** /admin — requiere sesión + rol Administrador */
export const ADMIN_AREA_GUARDS = [authGuard, roleGuard([ROLE_ADMIN])];

/** /cajero — requiere sesión + rol operativo (cajero u otro distinto de admin) */
export const CAJERO_AREA_GUARDS = [authGuard, cajeroGuard];
