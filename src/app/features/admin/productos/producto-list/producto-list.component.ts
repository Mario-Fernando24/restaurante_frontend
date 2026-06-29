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
import { Categoria } from '../../categorias/models/categoria.model';
import { CategoriaService } from '../../categorias/services/categoria.service';
import {
  Producto,
  ProductoEstado,
  CrearProductoRequest,
  TIPOS_PRODUCTO,
  TipoProducto,
} from '../models/producto.model';
import { ProductoService } from '../services/producto.service';

type ModalMode = 'create' | 'edit';

@Component({
  selector: 'app-producto-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PaginatorComponent,
    InputComponent,
    ButtonComponent,
  ],
  templateUrl: './producto-list.component.html',
  styleUrls: ['./producto-list.component.scss'],
})
export class ProductoListComponent implements OnInit, OnDestroy {
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly pageSizeOptions = [5, 10, 25, 50];
  readonly tiposProducto = TIPOS_PRODUCTO;

  readonly productoForm = this.fb.group({
    id_categoria: [null as number | null, Validators.required],
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    descripcion: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
    precio_venta: ['', [Validators.required, Validators.min(0)]],
    tipo_producto: ['' as TipoProducto | '', Validators.required],
  });

  productos: Producto[] = [];
  categorias: Categoria[] = [];
  loading = false;
  loadingCategorias = false;
  errorMessage = '';
  categoriasError = '';
  updatingId: number | null = null;

  showModal = false;
  modalMode: ModalMode = 'create';
  editingProducto: Producto | null = null;
  saving = false;
  formError = '';
  selectedImage: File | null = null;
  imagePreview: string | null = null;

  page = 1;
  pageSize = 10;
  totalItems = 0;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private confirmDialog: ConfirmDialogService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.page = 1;
        this.loadProductos();
      });

    this.loadCategorias();
    this.loadProductos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get modalTitle(): string {
    return this.modalMode === 'create' ? 'Nuevo producto' : 'Editar producto';
  }

  get modalDescription(): string {
    return this.modalMode === 'create'
      ? 'Completa los datos para registrar un producto en el menú.'
      : 'Actualiza los datos del producto seleccionado.';
  }

  get submitLabel(): string {
    return this.modalMode === 'create' ? 'Crear producto' : 'Guardar cambios';
  }

  get idCategoriaError(): string {
    return this.fieldError('id_categoria', { required: 'Debes seleccionar una categoría' });
  }

  get nombreError(): string {
    return this.fieldError('nombre', {
      required: 'El nombre es obligatorio',
      minlength: 'Mínimo 2 caracteres',
      maxlength: 'Máximo 80 caracteres',
    });
  }

  get descripcionError(): string {
    return this.fieldError('descripcion', {
      required: 'La descripción es obligatoria',
      minlength: 'Mínimo 3 caracteres',
      maxlength: 'Máximo 200 caracteres',
    });
  }

  get precioVentaError(): string {
    return this.fieldError('precio_venta', {
      required: 'El precio de venta es obligatorio',
      min: 'Debe ser mayor o igual a 0',
    });
  }

  get tipoProductoError(): string {
    return this.fieldError('tipo_producto', { required: 'Selecciona un tipo de producto' });
  }

  openCreateModal(): void {
    this.modalMode = 'create';
    this.editingProducto = null;
    this.formError = '';
    this.selectedImage = null;
    this.imagePreview = null;
    this.productoForm.reset();
    this.showModal = true;
  }

  openEditModal(producto: Producto): void {
    this.modalMode = 'edit';
    this.editingProducto = producto;
    this.formError = '';
    this.selectedImage = null;
    this.imagePreview = this.getImagenUrl(producto.imagen);
    this.productoForm.reset();
    this.productoForm.patchValue({
      id_categoria: producto.id_categoria,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio_venta: String(producto.precio_venta),
      tipo_producto: producto.tipo_producto as TipoProducto,
    });
    this.showModal = true;
  }

  closeModal(): void {
    if (this.saving) return;
    this.showModal = false;
    this.formError = '';
    this.editingProducto = null;
    this.selectedImage = null;
    this.imagePreview = null;
    this.productoForm.reset();
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedImage = file;

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    } else if (this.editingProducto) {
      this.imagePreview = this.getImagenUrl(this.editingProducto.imagen);
    } else {
      this.imagePreview = null;
    }
  }

  submitForm(): void {
    if (this.productoForm.invalid) {
      this.productoForm.markAllAsTouched();
      return;
    }

    const { id_categoria, nombre, descripcion, precio_venta, tipo_producto } =
      this.productoForm.getRawValue();

    this.saving = true;
    this.formError = '';

    this.buildPayload(id_categoria!, nombre!, descripcion!, Number(precio_venta), tipo_producto as TipoProducto)
      .then((payload) => {
        if (this.modalMode === 'create') {
          this.productoService.crearProducto(payload).subscribe({
            next: () => this.onSaveSuccess('Producto creado correctamente'),
            error: (err) => this.onSaveError(err?.message ?? 'Error al crear el producto'),
          });
          return;
        }

        this.productoService
          .actualizarProducto(this.editingProducto!.id_producto, payload)
          .subscribe({
            next: () => this.onSaveSuccess('Producto actualizado correctamente'),
            error: (err) => this.onSaveError(err?.message ?? 'Error al actualizar el producto'),
          });
      })
      .catch(() => {
        this.saving = false;
        this.notification.error('No se pudo procesar la imagen del producto');
      });
  }

  private async buildPayload(
    id_categoria: number,
    nombre: string,
    descripcion: string,
    precio_venta: number,
    tipo_producto: TipoProducto
  ): Promise<CrearProductoRequest> {
    const payload: CrearProductoRequest = {
      id_categoria,
      nombre,
      descripcion,
      precio_venta,
      tipo_producto,
    };

    if (this.selectedImage) {
      payload.imagen_base64 = await this.fileToBase64(this.selectedImage);
    }

    return payload;
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  loadCategorias(): void {
    this.loadingCategorias = true;
    this.categoriasError = '';

    this.categoriaService.getCategorias({ pageSize: 100 }).subscribe({
      next: (result) => {
        this.categorias = result.items.filter((c) => c.estado.toLowerCase() === 'activo');
        this.loadingCategorias = false;
      },
      error: (err) => {
        this.loadingCategorias = false;
        this.categoriasError = err?.message ?? 'Error al cargar las categorías';
      },
    });
  }

  loadProductos(): void {
    this.loading = true;
    this.errorMessage = '';

    this.productoService
      .getProductos({
        search: this.searchControl.value,
        page: this.page,
        pageSize: this.pageSize,
      })
      .subscribe({
        next: (result) => {

          console.log('Productos cargados:', result.items); // Debug log
          this.productos = result.items;
          this.totalItems = result.total;
          this.page = result.page;
          this.pageSize = result.pageSize;
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err?.message ?? 'Error al cargar los productos';
          this.productos = [];
          this.totalItems = 0;
        },
      });
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadProductos();
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize = pageSize;
    this.page = 1;
    this.loadProductos();
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

  getImagenUrl(imagen?: string): string | null {
    return this.productoService.getImagenUrl(imagen);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value);
  }

  formatDate(value?: string): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  toggleEstado(producto: Producto): void {
    if (this.isUpdating(producto.id_producto)) return;

    const nuevoEstado = this.productoService.getEstadoOpuesto(producto.estado);
    const desactivando = nuevoEstado === 'Inactivo';

    this.confirmDialog
      .open({
        title: desactivando ? '¿Desactivar producto?' : '¿Activar producto?',
        message: desactivando
          ? `El producto "${producto.nombre}" quedará inactivo y no estará disponible en el menú.`
          : `El producto "${producto.nombre}" quedará activo y estará disponible en el menú.`,
        confirmText: desactivando ? 'Sí, desactivar' : 'Sí, activar',
        cancelText: 'Cancelar',
        variant: desactivando ? 'danger' : 'success',
        icon: desactivando ? 'warning' : 'question',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.ejecutarCambioEstado(producto, nuevoEstado);
        }
      });
  }

  private onSaveSuccess(message: string): void {
    this.saving = false;
    this.showModal = false;
    this.productoForm.reset();
    this.editingProducto = null;
    this.selectedImage = null;
    this.imagePreview = null;
    this.page = 1;
    this.loadProductos();
    this.notification.success(message);
  }

  private onSaveError(message: string): void {
    this.saving = false;
    this.formError = message;
    this.notification.error(message);
  }

  private ejecutarCambioEstado(producto: Producto, nuevoEstado: ProductoEstado): void {
    this.updatingId = producto.id_producto;

    this.productoService.cambiarEstado(producto.id_producto, nuevoEstado).subscribe({
      next: (updated) => {
        const index = this.productos.findIndex(
          (item) => item.id_producto === producto.id_producto
        );

        if (index >= 0) {
          this.productos[index] = updated;
        }

        this.updatingId = null;
        this.notification.success(
          nuevoEstado === 'Activo'
            ? `Producto "${producto.nombre}" activado`
            : `Producto "${producto.nombre}" desactivado`
        );
      },
      error: (err) => {
        this.updatingId = null;
        this.notification.error(err?.message ?? 'Error al cambiar el estado');
      },
    });
  }

  private fieldError(
    controlName: string,
    messages: Record<string, string>
  ): string {
    const control = this.productoForm.get(controlName);
    if (!control?.touched || !control.errors) return '';

    for (const key of Object.keys(messages)) {
      if (control.errors[key]) return messages[key];
    }

    return '';
  }
}
