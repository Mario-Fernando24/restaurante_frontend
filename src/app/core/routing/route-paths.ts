import { ROLE_ADMIN } from '../auth/constants/roles';

/**
 * Rutas de Caucasia POS — fuente única de verdad.
 *
 * SEGMENTS → usar en `path` del Router (sin barra inicial).
 * ROUTES   → usar en navigate, routerLink y createUrlTree (con barra inicial).
 */

export const ROUTE_SEGMENTS = {
  AUTH: 'auth',
  LOGIN: 'login',
  ADMIN: 'admin',
  CAJERO: 'cajero',
  CATEGORIAS: 'categorias',
  USUARIOS: 'usuarios',
  CLIENTES: 'clientes',
  PRODUCTOS: 'productos',
  INSUMOS: 'insumos',
  RECETAS: 'recetas',
  TURNOS: 'turnos',
  INVENTARIO: 'inventario',
  MOVIMIENTOS: 'movimientos',
  STOCK: 'stock',
  COMPRAS: 'compras',
  COMPRAS_NUEVA: 'nueva',
  AUDITORIA: 'auditoria',
  CONFIGURACION: 'configuracion',
  REPORTES: 'reportes',
  GASTOS: 'gastos',
  MESAS: 'mesas',
  CARTA: 'carta',
  TURNO: 'turno',
  POS: 'pos',
} as const;

export const ROUTES = {
  LOGIN: '/auth/login',
  ADMIN: '/admin',
  CAJERO: '/cajero',
  ADMIN_CATEGORIAS: '/admin/categorias',
  ADMIN_USUARIOS: '/admin/usuarios',
  ADMIN_CLIENTES: '/admin/clientes',
  ADMIN_PRODUCTOS: '/admin/productos',
  ADMIN_INSUMOS: '/admin/insumos',
  ADMIN_RECETAS: '/admin/recetas',
  ADMIN_TURNOS: '/admin/turnos',
  ADMIN_MOVIMIENTOS: '/admin/inventario/movimientos',
  ADMIN_INVENTARIO_STOCK: '/admin/inventario/stock',
  ADMIN_INVENTARIO_COMPRAS: '/admin/inventario/compras',
  ADMIN_INVENTARIO_COMPRAS_NUEVA: '/admin/inventario/compras/nueva',
  ADMIN_AUDITORIA: '/admin/auditoria',
  ADMIN_CONFIGURACION: '/admin/configuracion',
  ADMIN_REPORTES: '/admin/reportes',
  ADMIN_GASTOS: '/admin/gastos',
  ADMIN_MESAS: '/admin/mesas',
  CAJERO_TURNO: '/cajero/turno',
  CAJERO_POS: '/cajero/pos',
  CAJERO_MESAS: '/cajero/mesas',
  CAJERO_GASTOS: '/cajero/gastos',
  CARTA_PUBLICA: '/carta',
} as const;

export const REDIRECT_PATHS = {
  LOGIN: `${ROUTE_SEGMENTS.AUTH}/${ROUTE_SEGMENTS.LOGIN}`,
  ADMIN: ROUTE_SEGMENTS.ADMIN,
  CAJERO: ROUTE_SEGMENTS.CAJERO,
} as const;

export function getDefaultRouteByRole(
  roleId: number | string | null | undefined
): string {
  return Number(roleId) === ROLE_ADMIN ? ROUTES.ADMIN : ROUTES.CAJERO;
}
