import { NgModule } from '@angular/core';
import { ButtonComponent } from './components/button/button.component';
import { InputComponent } from './components/input/input.component';

@NgModule({
  imports: [ButtonComponent, InputComponent],
  exports: [ButtonComponent, InputComponent],
})
export class SharedModule {}
