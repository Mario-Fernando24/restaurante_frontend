import { ROUTES } from '../../core/routing/route-paths';

export interface NavItem {
  label: string;
  route: string;
  icon: string;
}

export const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', route: ROUTES.ADMIN, icon: 'grid' },
  { label: 'Productos', route: ROUTES.ADMIN_PRODUCTOS, icon: 'box' },
  { label: 'Inventario', route: ROUTES.ADMIN_MOVIMIENTOS, icon: 'inventory' },
  { label: 'Insumos', route: ROUTES.ADMIN_INSUMOS, icon: 'inventory' },
  { label: 'Recetas', route: ROUTES.ADMIN_RECETAS, icon: 'tag' },
  { label: 'Clientes', route: ROUTES.ADMIN_CLIENTES, icon: 'users' },
  { label: 'Categorías', route: ROUTES.ADMIN_CATEGORIAS, icon: 'tag' },
  { label: 'Usuarios', route: ROUTES.ADMIN_USUARIOS, icon: 'user-cog' },
  { label: 'Turnos de Caja', route: ROUTES.ADMIN_TURNOS, icon: 'clock' },
  { label: 'Auditoría', route: ROUTES.ADMIN_AUDITORIA, icon: 'shield' },
];

export const CAJERO_NAV: NavItem[] = [
  { label: 'Inicio', route: ROUTES.CAJERO, icon: 'grid' },
  { label: 'Punto de Venta', route: ROUTES.CAJERO_POS, icon: 'pos' },
  { label: 'Turno de Caja', route: ROUTES.CAJERO_TURNO, icon: 'clock' },
];
