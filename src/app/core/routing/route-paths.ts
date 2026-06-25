import { ROLE_ADMIN } from '../auth/constants/roles';

/**
 * Rutas de Caucasia POS — fuente única de verdad.
 *
 * SEGMENTS → usar en `path` del Router (sin barra inicial).
 * ROUTES   → usar en navigate, routerLink y createUrlTree (con barra inicial).
 *
 * Mapa de la app:
 *   /auth/login   Login (solo invitados)
 *   /admin        Panel administrador (rol id_rol = 1)
 *   /cajero       Panel cajero / operaciones (rol id_rol ≠ 1)
 */
export const ROUTE_SEGMENTS = {
  AUTH: 'auth',
  LOGIN: 'login',
  ADMIN: 'admin',
  CAJERO: 'cajero',
} as const;

export const ROUTES = {
  LOGIN: '/auth/login',
  ADMIN: '/admin',
  CAJERO: '/cajero',
} as const;

/** Para `redirectTo` del Router (sin barra inicial). */
export const REDIRECT_PATHS = {
  LOGIN: `${ROUTE_SEGMENTS.AUTH}/${ROUTE_SEGMENTS.LOGIN}`,
  ADMIN: ROUTE_SEGMENTS.ADMIN,
  CAJERO: ROUTE_SEGMENTS.CAJERO,
} as const;

/** Ruta por defecto tras login según el rol del usuario. */
export function getDefaultRouteByRole(
  roleId: number | string | null | undefined
): string {
  return Number(roleId) === ROLE_ADMIN ? ROUTES.ADMIN : ROUTES.CAJERO;
  
}
