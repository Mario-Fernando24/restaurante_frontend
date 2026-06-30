import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {
  REDIRECT_PATHS,
  ROUTE_SEGMENTS,
} from './core/routing/route-paths';
import {
  ADMIN_AREA_GUARDS,
  CAJERO_AREA_GUARDS,
} from './core/routing/area-guards';
import { CartaPublicaComponent } from './features/public/carta/carta-publica.component';

const routes: Routes = [
  { path: '', redirectTo: REDIRECT_PATHS.LOGIN, pathMatch: 'full' },

  {
    path: ROUTE_SEGMENTS.CARTA,
    component: CartaPublicaComponent,
  },

  {
    path: ROUTE_SEGMENTS.AUTH,
    loadChildren: () =>
      import('./features/auth/auth.module').then((m) => m.AuthModule),
  },

  {
    path: ROUTE_SEGMENTS.ADMIN,
    canActivate: ADMIN_AREA_GUARDS,
    loadChildren: () =>
      import('./features/admin/admin.module').then((m) => m.AdminModule),
  },

  {
    path: ROUTE_SEGMENTS.CAJERO,
    canActivate: CAJERO_AREA_GUARDS,
    loadChildren: () =>
      import('./features/home/home.module').then((m) => m.HomeModule),
  },

  { path: '**', redirectTo: REDIRECT_PATHS.LOGIN },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
