import { Routes } from '@angular/router';
import { AuthLayoutComponent } from '../../layout/auth-layout/auth-layout.component';
import { LoginComponent } from './login/login.component';

// Rutas del módulo auth (nivel 2), se montan bajo /auth
// URL final: /auth + /login = /auth/login
export const AUTH_ROUTES: Routes = [
  {
    path: '',
    // Componente "marco": fondo decorativo + footer
    // Se renderiza en el <router-outlet> de app.component.html
    component: AuthLayoutComponent,

    // Rutas hijas: se renderizan en el <router-outlet> de auth-layout.component.html
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'login', component: LoginComponent },
    ],
  },
];
