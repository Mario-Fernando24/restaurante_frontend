import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Rutas principales de la app (nivel 1)
const routes: Routes = [
  // Al abrir http://localhost:4200/ redirige al login
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },

  // Todo lo que empiece con /auth carga el módulo de autenticación (lazy loading)
  // Las rutas hijas están definidas en features/auth/auth.routes.ts
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.module').then((m) => m.AuthModule),
  },

  // URL desconocida → login
  { path: '**', redirectTo: 'auth/login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
