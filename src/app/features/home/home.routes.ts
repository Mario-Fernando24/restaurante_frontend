import { Routes } from '@angular/router';
import { ROUTE_SEGMENTS } from '../../core/routing/route-paths';
import { arqueoActivoGuard } from '../caja/guards/arqueo-activo.guard';
import { PosPageComponent } from '../caja/pos/pos-page.component';
import { TurnoPageComponent } from '../caja/turno/turno-page.component';
import { MainLayoutComponent } from '../../layout/main-layout/main-layout.component';
import { HomeDashboardComponent } from './dashboard/home-dashboard.component';

/** Rutas hijas bajo /cajero (módulo en features/home, ver app-routing.module.ts) */
export const CAJERO_ROUTES: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', component: HomeDashboardComponent },
      { path: ROUTE_SEGMENTS.TURNO, component: TurnoPageComponent },
      {
        path: ROUTE_SEGMENTS.POS,
        component: PosPageComponent,
        canActivate: [arqueoActivoGuard],
      },
    ],
  },
];
