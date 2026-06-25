import { ROUTES } from '../../core/routing/route-paths';

export interface NavItem {
  label: string;
  route: string;
  icon: string;
}

export const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', route: ROUTES.ADMIN, icon: 'grid' },
  { label: 'Punto de Venta', route: ROUTES.ADMIN, icon: 'pos' },
  { label: 'Ventas', route: ROUTES.ADMIN, icon: 'sales' },
  { label: 'Productos', route: ROUTES.ADMIN, icon: 'box' },
  { label: 'Inventario', route: ROUTES.ADMIN, icon: 'inventory' },
  { label: 'Clientes', route: ROUTES.ADMIN, icon: 'users' },
  { label: 'Categorías', route: ROUTES.ADMIN_CATEGORIAS, icon: 'tag' },
  { label: 'Usuarios', route: ROUTES.ADMIN, icon: 'user-cog' },
  { label: 'Turnos de Caja', route: ROUTES.ADMIN, icon: 'clock' },
  { label: 'Auditoría', route: ROUTES.ADMIN, icon: 'shield' },
];

export const CAJERO_NAV: NavItem[] = [
  { label: 'Inicio', route: ROUTES.CAJERO, icon: 'grid' },
  { label: 'Ventas', route: ROUTES.CAJERO, icon: 'sales' },
  { label: 'Turnos de Caja', route: ROUTES.CAJERO, icon: 'clock' },
];
