import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { PaginatorComponent } from '../../../../shared/components/paginator/paginator.component';
import { ConfirmDialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Categoria, CategoriaEstado } from '../models/categoria.model';
import { CategoriaService } from '../services/categoria.service';

@Component({
  selector: 'app-categoria-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PaginatorComponent,
    InputComponent,
    ButtonComponent,
  ],
  templateUrl: './categoria-list.component.html',
  styleUrls: ['./categoria-list.component.scss'],
})
export class CategoriaListComponent implements OnInit, OnDestroy {
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly pageSizeOptions = [5, 10, 25, 50];

  readonly createForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    descripcion: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
  });

  categorias: Categoria[] = [];
  loading = false;
  errorMessage = '';
  updatingId: number | null = null;

  showCreateModal = false;
  creating = false;
  createError = '';

  page = 1;
  pageSize = 10;
  totalItems = 0;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private categoriaService: CategoriaService,
    private confirmDialog: ConfirmDialogService,
    private notification: NotificationService
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

  get nombreError(): string {
    const control = this.createForm.get('nombre');
    if (!control?.touched || !control.errors) return '';
    if (control.errors['required']) return 'El nombre es obligatorio';
    if (control.errors['minlength']) return 'Mínimo 2 caracteres';
    if (control.errors['maxlength']) return 'Máximo 80 caracteres';
    return '';
  }

  get descripcionError(): string {
    const control = this.createForm.get('descripcion');
    if (!control?.touched || !control.errors) return '';
    if (control.errors['required']) return 'La descripción es obligatoria';
    if (control.errors['minlength']) return 'Mínimo 3 caracteres';
    if (control.errors['maxlength']) return 'Máximo 200 caracteres';
    return '';
  }

  openCreateModal(): void {
    this.createForm.reset();
    this.createError = '';
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    if (this.creating) return;
    this.showCreateModal = false;
    this.createError = '';
    this.createForm.reset();
  }

  submitCreate(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const { nombre, descripcion } = this.createForm.getRawValue();
    this.creating = true;
    this.createError = '';

    this.categoriaService.crearCategoria({ nombre: nombre!, descripcion: descripcion! }).subscribe({
      next: () => {
        this.creating = false;
        this.showCreateModal = false;
        this.createForm.reset();
        this.page = 1;
        this.loadCategorias();
        this.notification.success('Categoría creada correctamente');
      },
      error: (err) => {
        this.creating = false;
        const message = err?.message ?? 'Error al crear la categoría';
        this.createError = message;
        this.notification.error(message);
      },
    });
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
    this.updatingId = categoria.id_categoria;

    this.categoriaService.cambiarEstado(categoria.id_categoria, nuevoEstado).subscribe({
      next: (updated) => {
        const index = this.categorias.findIndex(
          (item) => item.id_categoria === categoria.id_categoria
        );

        if (index >= 0) {
          this.categorias[index] = updated;
        }

        this.updatingId = null;
        this.notification.success(
          nuevoEstado === 'Activo'
            ? `Categoría "${categoria.nombre}" activada`
            : `Categoría "${categoria.nombre}" desactivada`
        );
      },
      error: (err) => {
        this.updatingId = null;
        this.notification.error(err?.message ?? 'Error al cambiar el estado');
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
