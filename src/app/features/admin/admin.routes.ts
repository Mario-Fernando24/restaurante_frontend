import { Routes } from '@angular/router';
import { MainLayoutComponent } from '../../layout/main-layout/main-layout.component';
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';

/** Rutas hijas bajo /admin (ver app-routing.module.ts) */
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [{ path: '', component: AdminDashboardComponent }],
  },
];
