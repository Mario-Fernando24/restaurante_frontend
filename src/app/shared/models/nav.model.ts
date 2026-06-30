import { ROUTES } from '../../core/routing/route-paths';

export interface NavItem {
  label: string;
  route: string;
  icon: string;
}

export const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', route: ROUTES.ADMIN, icon: 'grid' },
  { label: 'Reportes', route: ROUTES.ADMIN_REPORTES, icon: 'grid' },
  { label: 'Productos', route: ROUTES.ADMIN_PRODUCTOS, icon: 'box' },
  { label: 'Compras', route: ROUTES.ADMIN_INVENTARIO_COMPRAS, icon: 'inventory' },
  { label: 'Stock', route: ROUTES.ADMIN_INVENTARIO_STOCK, icon: 'inventory' },
  { label: 'Movimientos', route: ROUTES.ADMIN_MOVIMIENTOS, icon: 'inventory' },
  { label: 'Insumos', route: ROUTES.ADMIN_INSUMOS, icon: 'inventory' },
  { label: 'Recetas', route: ROUTES.ADMIN_RECETAS, icon: 'tag' },
  { label: 'Clientes y proveedores', route: ROUTES.ADMIN_CLIENTES, icon: 'users' },
  { label: 'Categorías', route: ROUTES.ADMIN_CATEGORIAS, icon: 'tag' },
  { label: 'Mesas', route: ROUTES.ADMIN_MESAS, icon: 'grid' },
  { label: 'Usuarios', route: ROUTES.ADMIN_USUARIOS, icon: 'user-cog' },
  { label: 'Turnos de Caja', route: ROUTES.ADMIN_TURNOS, icon: 'clock' },
  { label: 'Egresos de caja', route: ROUTES.ADMIN_GASTOS, icon: 'inventory' },
  { label: 'Datos del negocio', route: ROUTES.ADMIN_CONFIGURACION, icon: 'shield' },
  { label: 'Auditoría', route: ROUTES.ADMIN_AUDITORIA, icon: 'shield' },
];

export const CAJERO_NAV: NavItem[] = [
  { label: 'Inicio', route: ROUTES.CAJERO, icon: 'grid' },
  { label: 'Punto de Venta', route: ROUTES.CAJERO_POS, icon: 'pos' },
  { label: 'Mesas', route: ROUTES.CAJERO_MESAS, icon: 'grid' },
  { label: 'Egresos de caja', route: ROUTES.CAJERO_GASTOS, icon: 'inventory' },
  { label: 'Apertura de caja', route: ROUTES.CAJERO_TURNO, icon: 'clock' },
];
