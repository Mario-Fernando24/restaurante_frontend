import { Routes } from '@angular/router';
import { MainLayoutComponent } from '../../layout/main-layout/main-layout.component';
import { CategoriaListComponent } from './categorias/categoria-list/categoria-list.component';
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';
import { ROUTE_SEGMENTS } from '../../core/routing/route-paths';

/** Rutas hijas bajo /admin (ver app-routing.module.ts) */
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', component: AdminDashboardComponent },
      {
        path: ROUTE_SEGMENTS.CATEGORIAS,
        component: CategoriaListComponent,
      },
    ],
  },
];
