import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
})
export class ButtonComponent {
  // Permite personalizar el botón con diferentes estilos y tamaños, y manejar su estado de carga y deshabilitado.
  @Input() variant: ButtonVariant = 'primary';
  // El tipo del botón (button, submit o reset) se puede configurar para que se comporte correctamente dentro de formularios.
  @Input() size: ButtonSize = 'md';
  // El botón puede ocupar todo el ancho de su contenedor si fullWidth es true, lo que es útil para botones de acción principales en dispositivos móviles.
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  // El estado de carga muestra un spinner y deshabilita el botón para evitar múltiples envíos.
  @Input() disabled = false;
  // El botón emite un evento clicked cuando se hace clic, lo que permite a los componentes padres manejar la acción sin preocuparse por el estado interno del botón.
  @Input() fullWidth = false;
  // El botón puede mostrar un spinner de carga cuando loading es true, lo que indica al usuario que se está procesando una acción.
  @Input() loading = false;
// El evento clicked se emite solo si el botón no está deshabilitado ni en estado de carga, lo que garantiza una experiencia de usuario consistente y evita acciones no deseadas.
  @Output() clicked = new EventEmitter<MouseEvent>();

  onClick(event: MouseEvent): void {
    if (!this.disabled && !this.loading) {
      this.clicked.emit(event);
    }
  }
}
