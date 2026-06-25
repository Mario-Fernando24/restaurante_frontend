import { Routes } from '@angular/router';
import { MainLayoutComponent } from '../../layout/main-layout/main-layout.component';
import { HomeDashboardComponent } from './dashboard/home-dashboard.component';

/** Rutas hijas bajo /cajero (módulo en features/home, ver app-routing.module.ts) */
export const CAJERO_ROUTES: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [{ path: '', component: HomeDashboardComponent }],
  },
];
