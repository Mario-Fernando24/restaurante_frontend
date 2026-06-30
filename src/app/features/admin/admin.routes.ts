import { Routes } from '@angular/router';
import { MainLayoutComponent } from '../../layout/main-layout/main-layout.component';
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';
import { CategoriaListComponent } from './categorias/categoria-list/categoria-list.component';
import { UsuarioListComponent } from './usuarios/usuario-list/usuario-list.component';
import { ClienteListComponent } from './clientes/cliente-list/cliente-list.component';
import { InsumoListComponent } from './insumos/insumo-list/insumo-list.component';
import { ProductoListComponent } from './productos/producto-list/producto-list.component';
import { RecetaListComponent } from './recetas/receta-list/receta-list.component';
import { TurnoListComponent } from './turnos/turno-list/turno-list.component';
import { MovimientoListComponent } from './inventario/movimiento-list/movimiento-list.component';
import { StockPorCategoriaComponent } from './inventario/stock-por-categoria/stock-por-categoria.component';
import { CompraListComponent } from './inventario/compra-list/compra-list.component';
import { CompraDetalleComponent } from './inventario/compra-detalle/compra-detalle.component';
import { CompraInventarioComponent } from './inventario/compra-inventario/compra-inventario.component';
import { AuditoriaListComponent } from './auditoria/auditoria-list/auditoria-list.component';
import { EmpresaConfigComponent } from './configuracion/empresa-config.component';
import { ReportesAdminComponent } from './reportes/reportes-admin.component';
import { GastoPageComponent } from '../caja/gastos/gasto-page.component';
import { MesaListComponent } from './mesas/mesa-list/mesa-list.component';
import { ROUTE_SEGMENTS } from '../../core/routing/route-paths';

/** Rutas hijas bajo /admin (ver app-routing.module.ts) */
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', component: AdminDashboardComponent },
      { path: ROUTE_SEGMENTS.REPORTES, component: ReportesAdminComponent },
      { path: ROUTE_SEGMENTS.CATEGORIAS, component: CategoriaListComponent },
      { path: ROUTE_SEGMENTS.USUARIOS, component: UsuarioListComponent },
      { path: ROUTE_SEGMENTS.CLIENTES, component: ClienteListComponent },
      { path: ROUTE_SEGMENTS.INSUMOS, component: InsumoListComponent },
      { path: ROUTE_SEGMENTS.PRODUCTOS, component: ProductoListComponent },
      { path: ROUTE_SEGMENTS.RECETAS, component: RecetaListComponent },
      { path: ROUTE_SEGMENTS.TURNOS, component: TurnoListComponent },
      {
        path: `${ROUTE_SEGMENTS.INVENTARIO}/${ROUTE_SEGMENTS.MOVIMIENTOS}`,
        component: MovimientoListComponent,
      },
      {
        path: `${ROUTE_SEGMENTS.INVENTARIO}/${ROUTE_SEGMENTS.STOCK}`,
        component: StockPorCategoriaComponent,
      },
      {
        path: `${ROUTE_SEGMENTS.INVENTARIO}/${ROUTE_SEGMENTS.COMPRAS}/${ROUTE_SEGMENTS.COMPRAS_NUEVA}`,
        component: CompraInventarioComponent,
      },
      {
        path: `${ROUTE_SEGMENTS.INVENTARIO}/${ROUTE_SEGMENTS.COMPRAS}/:id`,
        component: CompraDetalleComponent,
      },
      {
        path: `${ROUTE_SEGMENTS.INVENTARIO}/${ROUTE_SEGMENTS.COMPRAS}`,
        component: CompraListComponent,
      },
      { path: ROUTE_SEGMENTS.AUDITORIA, component: AuditoriaListComponent },
      { path: ROUTE_SEGMENTS.CONFIGURACION, component: EmpresaConfigComponent },
      { path: ROUTE_SEGMENTS.MESAS, component: MesaListComponent },
      { path: ROUTE_SEGMENTS.GASTOS, component: GastoPageComponent },
    ],
  },
];
