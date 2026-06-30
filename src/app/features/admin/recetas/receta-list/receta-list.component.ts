import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { forkJoin, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, takeUntil } from 'rxjs/operators';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { SelectComponent, SelectOption } from '../../../../shared/components/select/select.component';
import { PaginatorComponent } from '../../../../shared/components/paginator/paginator.component';
import { NotificationService } from '../../../../core/services/notification.service';
import { Insumo } from '../../insumos/models/insumo.model';
import { InsumoService } from '../../insumos/services/insumo.service';
import { Producto } from '../../productos/models/producto.model';
import { ProductoService } from '../../productos/services/producto.service';
import { Receta, RecetaGrupo, RecetaLinea } from '../models/receta.model';
import { RecetaService } from '../services/receta.service';
import {
  calcularCostoRecetaLinea,
  calcularGanancia,
  calcularMargenPorcentaje,
} from '../utils/receta-costo.util';

@Component({
  selector: 'app-receta-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PaginatorComponent,
    InputComponent,
    SelectComponent,
    ButtonComponent,
  ],
  templateUrl: './receta-list.component.html',
  styleUrls: ['./receta-list.component.scss'],
})
export class RecetaListComponent implements OnInit, OnDestroy {
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly pageSizeOptions = [5, 10, 25, 50];

  readonly recetaForm = this.fb.group({
    id_producto: [null as number | null, Validators.required],
    id_insumo: [null as number | null, Validators.required],
    cantidad_usada: ['', [Validators.required, Validators.min(0.001)]],
  });

  grupos: RecetaGrupo[] = [];
  productos: Producto[] = [];
  insumos: Insumo[] = [];
  loading = false;
  loadingSelectors = false;
  errorMessage = '';
  selectorsError = '';

  showFormModal = false;
  saving = false;
  formError = '';
  editingRecetaId: number | null = null;

  page = 1;
  pageSize = 10;
  totalItems = 0;

  private allGrupos: RecetaGrupo[] = [];
  private allRecetas: Receta[] = [];
  private productosById = new Map<number, Producto>();
  private insumosById = new Map<number, Insumo>();
  private readonly destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private recetaService: RecetaService,
    private productoService: ProductoService,
    private insumoService: InsumoService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.page = 1;
        this.applySearchAndPagination();
      });

    this.loadRecetas();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isEditing(): boolean {
    return this.editingRecetaId != null;
  }

  get idProductoError(): string {
    return this.fieldError('id_producto', { required: 'Selecciona un producto' });
  }

  get idInsumoError(): string {
    return this.fieldError('id_insumo', { required: 'Selecciona un ingrediente' });
  }

  get cantidadUsadaError(): string {
    return this.fieldError('cantidad_usada', {
      required: 'La cantidad es obligatoria',
      min: 'Debe ser mayor a 0',
    });
  }

  get cantidadHint(): string {
    const idInsumo = this.recetaForm.get('id_insumo')?.value;
    if (!idInsumo) {
      return 'Indica cuánto de ese ingrediente se usa por cada unidad vendida';
    }
    const insumo = this.insumosById.get(idInsumo);
    if (!insumo) return 'Indica cuánto de ese ingrediente se usa por cada unidad vendida';
    return `Cantidad en ${this.unidadLegible(insumo.unidad_medida)} (por 1 unidad vendida)`;
  }

  get productoOptions(): SelectOption<number>[] {
    return this.productos.map((producto) => ({
      value: producto.id_producto,
      label: producto.nombre,
    }));
  }

  get insumoOptions(): SelectOption<number>[] {
    return this.insumos.map((insumo) => ({
      value: insumo.id_insumo,
      label: `${insumo.nombre} (${insumo.unidad_medida.toLowerCase()})`,
    }));
  }

  get productoSelectHint(): string {
    if (this.loadingSelectors) return 'Cargando productos...';
    if (this.productos.length === 0) {
      return 'No hay productos tipo PREPARADO. Créalos primero en Productos.';
    }
    return '';
  }

  get previewCostoInsumo(): string | null {
    const idInsumo = this.recetaForm.get('id_insumo')?.value;
    const cantidad = Number(this.recetaForm.get('cantidad_usada')?.value);
    if (!idInsumo || !cantidad || cantidad <= 0) return null;

    const insumo = this.insumosById.get(idInsumo);
    if (!insumo) return null;

    const costo = calcularCostoRecetaLinea(cantidad, insumo.costo_unitario);
    return this.formatCurrency(costo);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  openCreateModal(): void {
    this.editingRecetaId = null;
    this.recetaForm.reset();
    this.recetaForm.get('id_producto')?.enable();
    this.recetaForm.get('id_insumo')?.enable();
    this.formError = '';
    this.loadSelectors();
    this.showFormModal = true;
  }

  openEditModal(grupo: RecetaGrupo, linea: RecetaLinea): void {
    this.editingRecetaId = linea.id_receta;
    this.formError = '';
    this.loadSelectors();
    this.recetaForm.reset({
      id_producto: grupo.id_producto,
      id_insumo: linea.id_insumo,
      cantidad_usada: String(linea.cantidad_usada),
    });
    this.showFormModal = true;
  }

  closeFormModal(): void {
    if (this.saving) return;
    this.showFormModal = false;
    this.editingRecetaId = null;
    this.formError = '';
    this.recetaForm.reset();
  }

  submitForm(): void {
    if (this.recetaForm.invalid) {
      this.recetaForm.markAllAsTouched();
      return;
    }

    const { id_producto, id_insumo, cantidad_usada } = this.recetaForm.getRawValue();
    const payload = {
      id_producto: id_producto!,
      id_insumo: id_insumo!,
      cantidad_usada: Number(cantidad_usada),
    };

    if (this.isDuplicatePair(payload.id_producto, payload.id_insumo, this.editingRecetaId)) {
      const message = 'Este producto ya tiene ese ingrediente en la receta';
      this.formError = message;
      this.notification.error(message);
      return;
    }

    this.saving = true;
    this.formError = '';
    const wasEditing = this.isEditing;

    const request$ = wasEditing
      ? this.recetaService.actualizarReceta(this.editingRecetaId!, payload)
      : this.recetaService.crearReceta(payload);

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.showFormModal = false;
        this.editingRecetaId = null;
        this.recetaForm.reset();
        this.loadRecetas();
        this.notification.success(
          wasEditing ? 'Receta actualizada correctamente' : 'Ingrediente agregado a la receta'
        );
      },
      error: (err) => {
        this.saving = false;
        const message =
          err?.message ??
          (wasEditing ? 'Error al actualizar la receta' : 'Error al crear la receta');
        this.formError = message;
        this.notification.error(message);
      },
    });
  }

  loadSelectors(): void {
    this.loadingSelectors = true;
    this.selectorsError = '';

    this.productoService
      .getProductos({ pageSize: 1000 })
      .pipe(map((result) => result.items.filter((p) => p.tipo_producto === 'PREPARADO')))
      .subscribe({
        next: (productos) => {
          this.productos = productos;
          this.productosById = new Map(productos.map((p) => [p.id_producto, p]));
          this.loadingSelectors = false;
        },
        error: (err) => {
          this.loadingSelectors = false;
          this.selectorsError = err?.message ?? 'Error al cargar productos';
        },
      });

    this.insumoService.getInsumos({ pageSize: 1000 }).subscribe({
      next: (result) => {
        this.insumos = result.items;
        this.insumosById = new Map(result.items.map((i) => [i.id_insumo, i]));
      },
      error: (err) => {
        this.selectorsError = err?.message ?? 'Error al cargar ingredientes';
      },
    });
  }

  loadRecetas(): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      recetas: this.recetaService.getRecetas({ pageSize: 10000 }),
      productos: this.productoService.getProductos({ pageSize: 1000 }),
      insumos: this.insumoService.getInsumos({ pageSize: 1000 }),
    }).subscribe({
      next: ({ recetas, productos, insumos }) => {
        this.allRecetas = recetas.items;
        this.productosById = new Map(productos.items.map((p) => [p.id_producto, p]));
        this.insumosById = new Map(insumos.items.map((i) => [i.id_insumo, i]));
        this.allGrupos = this.buildGrupos(recetas.items);
        this.applySearchAndPagination();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.message ?? 'Error al cargar las recetas';
        this.allGrupos = [];
        this.allRecetas = [];
        this.grupos = [];
        this.totalItems = 0;
      },
    });
  }

  onPageChange(page: number): void {
    this.page = page;
    this.applySearchAndPagination();
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize = pageSize;
    this.page = 1;
    this.applySearchAndPagination();
  }

  private isDuplicatePair(
    idProducto: number,
    idInsumo: number,
    excludeRecetaId: number | null = null
  ): boolean {
    return this.allRecetas.some(
      (receta) =>
        receta.id_producto === idProducto &&
        receta.id_insumo === idInsumo &&
        receta.id_receta !== excludeRecetaId
    );
  }

  private applySearchAndPagination(): void {
    const term = this.searchControl.value.trim().toLowerCase();
    let filtered = this.allGrupos;

    if (term) {
      filtered = this.allGrupos.filter(
        (grupo) =>
          grupo.nombreProducto.toLowerCase().includes(term) ||
          grupo.lineas.some((linea) => linea.nombreInsumo.toLowerCase().includes(term))
      );
    }

    this.totalItems = filtered.length;
    const start = (this.page - 1) * this.pageSize;
    this.grupos = filtered.slice(start, start + this.pageSize);
  }

  private buildGrupos(recetas: Receta[]): RecetaGrupo[] {
    const map = new Map<number, RecetaGrupo>();

    for (const receta of recetas) {
      const producto = this.productosById.get(receta.id_producto);
      const insumo = this.insumosById.get(receta.id_insumo);
      const nombreProducto =
        producto?.nombre ?? receta.nombre_producto ?? `Producto #${receta.id_producto}`;
      const nombreInsumo =
        insumo?.nombre ?? receta.nombre_insumo ?? `Ingrediente #${receta.id_insumo}`;
      const unidad = String(insumo?.unidad_medida ?? '');
      const costoUnitario = insumo?.costo_unitario ?? 0;
      const costoInsumo = calcularCostoRecetaLinea(receta.cantidad_usada, costoUnitario);

      const linea: RecetaLinea = {
        id_receta: receta.id_receta,
        id_insumo: receta.id_insumo,
        nombreInsumo,
        cantidad_usada: receta.cantidad_usada,
        cantidadLabel: this.formatCantidad(receta.cantidad_usada, unidad),
        unidad_medida: unidad,
        costoUnitario,
        costoInsumo,
        costoDetalle: this.formatCostoDetalle(receta.cantidad_usada, unidad, costoUnitario),
      };

      const existing = map.get(receta.id_producto);
      if (existing) {
        existing.lineas.push(linea);
      } else {
        map.set(receta.id_producto, {
          id_producto: receta.id_producto,
          nombreProducto,
          precioVenta: 0,
          costoTotal: 0,
          ganancia: 0,
          margenPorcentaje: null,
          lineas: [linea],
        });
      }
    }

    return Array.from(map.values())
      .map((grupo) => {
        const producto = this.productosById.get(grupo.id_producto);
        const precioVenta = producto?.precio_venta ?? 0;
        const costoTotal = grupo.lineas.reduce((sum, linea) => sum + linea.costoInsumo, 0);
        const ganancia = calcularGanancia(precioVenta, costoTotal);

        return {
          ...grupo,
          precioVenta,
          costoTotal,
          ganancia,
          margenPorcentaje: calcularMargenPorcentaje(precioVenta, ganancia),
          lineas: grupo.lineas.sort((a, b) => a.nombreInsumo.localeCompare(b.nombreInsumo)),
        };
      })
      .sort((a, b) => a.nombreProducto.localeCompare(b.nombreProducto));
  }

  private formatCostoDetalle(
    cantidad: number,
    unidad: string,
    costoUnitario: number
  ): string {
    const unidadCorta = this.unidadCorta(unidad);
    return `${this.formatCantidad(cantidad, unidad)} × ${this.formatCurrency(costoUnitario)}/${unidadCorta}`;
  }

  private unidadCorta(unidad: string): string {
    switch (unidad.toUpperCase()) {
      case 'GRAMO':
        return 'g';
      case 'UNIDAD':
        return 'ud';
      case 'MILILITRO':
        return 'ml';
      case 'LITRO':
        return 'L';
      default:
        return unidad.toLowerCase() || 'ud';
    }
  }

  private formatCantidad(cantidad: number, unidad: string): string {
    switch (unidad.toUpperCase()) {
      case 'GRAMO':
        return `${cantidad} g`;
      case 'UNIDAD':
        return cantidad === 1 ? '1 unidad' : `${cantidad} unidades`;
      case 'MILILITRO':
        return `${cantidad} ml`;
      case 'LITRO':
        return cantidad === 1 ? '1 litro' : `${cantidad} litros`;
      default:
        return unidad ? `${cantidad} ${unidad.toLowerCase()}` : String(cantidad);
    }
  }

  private unidadLegible(unidad: string): string {
    switch (unidad.toUpperCase()) {
      case 'GRAMO':
        return 'gramos';
      case 'UNIDAD':
        return 'unidades';
      case 'MILILITRO':
        return 'mililitros';
      case 'LITRO':
        return 'litros';
      default:
        return unidad.toLowerCase();
    }
  }

  private fieldError(
    controlName: string,
    messages: Record<string, string>
  ): string {
    const control = this.recetaForm.get(controlName);
    if (!control?.touched || !control.errors) return '';

    for (const key of Object.keys(messages)) {
      if (control.errors[key]) return messages[key];
    }

    return '';
  }
}
