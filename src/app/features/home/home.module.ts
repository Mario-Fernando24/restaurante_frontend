import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CAJERO_ROUTES } from './home.routes';

@NgModule({
  imports: [RouterModule.forChild(CAJERO_ROUTES)],
})
export class HomeModule {}
