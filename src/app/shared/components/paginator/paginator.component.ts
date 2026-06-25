import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-paginator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './paginator.component.html',
  styleUrls: ['./paginator.component.scss'],
})
export class PaginatorComponent {
  // Input ayuda a recibir datos desde el componente padre, mientras que Output permite emitir eventos hacia el componente padre.
  @Input() page = 1;
  @Input() pageSize = 10;
  @Input() totalItems = 0;
  @Input() pageSizeOptions: number[] = [5, 10, 25, 50];

  // Output ayuda a emitir eventos hacia el componente padre.
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();
  
  // Calcula el número total de páginas basado en el total de elementos y el tamaño de página.
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalItems / this.pageSize));
  }
  
  // Calcula el índice del primer elemento en la página actual.
  get rangeStart(): number {
    if (!this.totalItems) return 0;
    return (this.page - 1) * this.pageSize + 1;
  }
  
  // Calcula el índice del último elemento en la página actual.
  get rangeEnd(): number {
    return Math.min(this.page * this.pageSize, this.totalItems);
  }

  // Determina si se puede ir a la página anterior.
  get canGoPrev(): boolean {
    return this.page > 1;
  }

  // Determina si se puede ir a la página siguiente.
  get canGoNext(): boolean {
    return this.page < this.totalPages;
  }

  // Maneja el cambio de tamaño de página y emite un evento hacia el componente padre.
  onPageSizeChange(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.pageSizeChange.emit(value);
  }

  // Cambia a la página anterior si es posible.
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.page) return;
    this.pageChange.emit(page);
  }
}
