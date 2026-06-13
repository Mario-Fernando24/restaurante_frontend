import { Routes } from '@angular/router';
import { AuthLayoutComponent } from '../../layout/auth-layout/auth-layout.component';
import { LoginComponent } from './login/login.component';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'login', component: LoginComponent },
    ],
  },
];
