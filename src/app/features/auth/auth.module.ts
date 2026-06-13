import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AUTH_ROUTES } from './auth.routes';

// Registra las rutas hijas bajo /auth (importado desde app-routing con loadChildren)
@NgModule({
  imports: [RouterModule.forChild(AUTH_ROUTES)],
})
export class AuthModule {}
