import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { PaginatorComponent } from '../../../../shared/components/paginator/paginator.component';
import { ConfirmDialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { Categoria, CategoriaEstado } from '../models/categoria.model';
import { CategoriaService } from '../services/categoria.service';

@Component({
  selector: 'app-categoria-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PaginatorComponent],
  templateUrl: './categoria-list.component.html',
  styleUrls: ['./categoria-list.component.scss'],
})
export class CategoriaListComponent implements OnInit, OnDestroy {
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly pageSizeOptions = [5, 10, 25, 50];

  categorias: Categoria[] = [];
  loading = false;
  errorMessage = '';
  actionError = '';
  updatingId: number | null = null;

  page = 1;
  pageSize = 10;
  totalItems = 0;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private categoriaService: CategoriaService,
    private confirmDialog: ConfirmDialogService
  ) {}

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.page = 1;
        this.loadCategorias();
      });

    this.loadCategorias();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCategorias(): void {
    this.loading = true;
    this.errorMessage = '';

    this.categoriaService
      .getCategorias({
        search: this.searchControl.value,
        page: this.page,
        pageSize: this.pageSize,
      })
      .subscribe({
        next: (result) => {
          this.categorias = result.items;
          this.totalItems = result.total;
          this.page = result.page;
          this.pageSize = result.pageSize;
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err?.message ?? 'Error al cargar las categorías';
          this.categorias = [];
          this.totalItems = 0;
        },
      });
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadCategorias();
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize = pageSize;
    this.page = 1;
    this.loadCategorias();
  }

  isActivo(estado: string): boolean {
    return estado.toLowerCase() === 'activo';
  }

  isUpdating(id: number): boolean {
    return this.updatingId === id;
  }

  getToggleLabel(estado: string): string {
    return this.isActivo(estado) ? 'Desactivar' : 'Activar';
  }

  toggleEstado(categoria: Categoria): void {
    if (this.isUpdating(categoria.id_categoria)) return;

    const nuevoEstado = this.categoriaService.getEstadoOpuesto(categoria.estado);
    const desactivando = nuevoEstado === 'Inactivo';

    this.confirmDialog
      .open({
        title: desactivando ? '¿Desactivar categoría?' : '¿Activar categoría?',
        message: desactivando
          ? `La categoría "${categoria.nombre}" quedará inactiva y no estará disponible en el menú.`
          : `La categoría "${categoria.nombre}" quedará activa y estará disponible en el menú.`,
        confirmText: desactivando ? 'Sí, desactivar' : 'Sí, activar',
        cancelText: 'Cancelar',
        variant: desactivando ? 'danger' : 'success',
        icon: desactivando ? 'warning' : 'question',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.ejecutarCambioEstado(categoria, nuevoEstado);
        }
      });
  }

  private ejecutarCambioEstado(categoria: Categoria, nuevoEstado: CategoriaEstado): void {
    // Marcar la categoría como en proceso de actualización y limpiar cualquier error previo
    this.updatingId = categoria.id_categoria;
    this.actionError = '';

    this.categoriaService.cambiarEstado(categoria.id_categoria, nuevoEstado).subscribe({
      next: (updated) => {
        // Actualizar la categoría en la lista localmente
        const index = this.categorias.findIndex(
          (item) => item.id_categoria === categoria.id_categoria
        );
        // Si se encuentra la categoría, actualizarla con los nuevos datos
        if (index >= 0) {
          this.categorias[index] = updated;
        }
       // Limpiar el estado de actualización y cualquier mensaje de error
        this.updatingId = null;
      },
      error: (err) => {
        this.updatingId = null;
        this.actionError = err?.message ?? 'Error al cambiar el estado';
      },
    });
  }

  formatDate(value: string): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}
