import { Routes } from '@angular/router';
import { guestGuard } from '../../core/auth/guards/guest.guard';
import { ROUTE_SEGMENTS } from '../../core/routing/route-paths';
import { AuthLayoutComponent } from '../../layout/auth-layout/auth-layout.component';
import { LoginComponent } from './login/login.component';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: '', redirectTo: ROUTE_SEGMENTS.LOGIN, pathMatch: 'full' },
      {
        path: ROUTE_SEGMENTS.LOGIN,
        component: LoginComponent,
        canActivate: [guestGuard],
      },
    ],
  },
];
