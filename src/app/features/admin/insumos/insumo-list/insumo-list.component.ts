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
import { NotificationService } from '../../../../core/services/notification.service';
import { Insumo, UNIDADES_MEDIDA, UnidadMedida } from '../models/insumo.model';
import { InsumoService } from '../services/insumo.service';
import {
  calcularCostoPorGramoDesdeLibra,
  calcularCostoPorUnidadMedida,
  GRAMOS_POR_LIBRA_DEFAULT,
  unidadMedidaCorta,
  unidadMedidaLegible,
} from '../utils/insumo-costo.util';

@Component({
  selector: 'app-insumo-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PaginatorComponent,
    InputComponent,
    ButtonComponent,
  ],
  templateUrl: './insumo-list.component.html',
  styleUrls: ['./insumo-list.component.scss'],
})
export class InsumoListComponent implements OnInit, OnDestroy {
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly pageSizeOptions = [5, 10, 25, 50];
  readonly unidadesMedida = UNIDADES_MEDIDA;

  readonly insumoForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    unidad_medida: ['' as UnidadMedida | '', Validators.required],
    stock_actual: ['0', [Validators.required, Validators.min(0)]],
    stock_minimo: ['0', [Validators.required, Validators.min(0)]],
    costo_por_unidad: [''],
    precio_por_libra: [''],
    gramos_por_libra: [String(GRAMOS_POR_LIBRA_DEFAULT)],
    costo_compra_total: [''],
    cantidad_compra: [''],
  });

  insumos: Insumo[] = [];
  loading = false;
  errorMessage = '';

  showFormModal = false;
  saving = false;
  formError = '';
  editingInsumoId: number | null = null;
  costoGuardadoActual: number | null = null;

  page = 1;
  pageSize = 10;
  totalItems = 0;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private insumoService: InsumoService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.page = 1;
        this.loadInsumos();
      });

    this.loadInsumos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isEditing(): boolean {
    return this.editingInsumoId != null;
  }

  get unidadSeleccionada(): string {
    return this.insumoForm.get('unidad_medida')?.value ?? '';
  }

  get usesLibraCalculator(): boolean {
    return this.unidadSeleccionada === 'GRAMO';
  }

  get usesCompraTotalCalculator(): boolean {
    return this.unidadSeleccionada === 'MILILITRO' || this.unidadSeleccionada === 'LITRO';
  }

  get usesCostoPorUnidad(): boolean {
    return this.unidadSeleccionada === 'UNIDAD';
  }

  get previewCostoUnitario(): number | null {
    return this.resolveCostoUnitario(false);
  }

  get nombreError(): string {
    return this.fieldError('nombre', {
      required: 'El nombre es obligatorio',
      minlength: 'Mínimo 2 caracteres',
      maxlength: 'Máximo 80 caracteres',
    });
  }

  get unidadMedidaError(): string {
    return this.fieldError('unidad_medida', { required: 'Selecciona una unidad de medida' });
  }

  get stockActualError(): string {
    return this.fieldError('stock_actual', {
      required: 'El stock actual es obligatorio',
      min: 'Debe ser mayor o igual a 0',
    });
  }

  get stockMinimoError(): string {
    return this.fieldError('stock_minimo', {
      required: 'El stock mínimo es obligatorio',
      min: 'Debe ser mayor o igual a 0',
    });
  }

  get costoPorUnidadError(): string {
    return this.fieldError('costo_por_unidad', { min: 'Debe ser mayor o igual a 0' });
  }

  get precioPorLibraError(): string {
    return this.fieldError('precio_por_libra', { min: 'Debe ser mayor a 0' });
  }

  get gramosPorLibraError(): string {
    return this.fieldError('gramos_por_libra', { min: 'Debe ser mayor a 0' });
  }

  get costoCompraTotalError(): string {
    return this.fieldError('costo_compra_total', { min: 'Debe ser mayor a 0' });
  }

  get cantidadCompraError(): string {
    return this.fieldError('cantidad_compra', { min: 'Debe ser mayor a 0' });
  }

  openCreateModal(): void {
    this.editingInsumoId = null;
    this.costoGuardadoActual = null;
    this.insumoForm.reset({
      nombre: '',
      unidad_medida: '',
      stock_actual: '0',
      stock_minimo: '0',
      costo_por_unidad: '',
      precio_por_libra: '',
      gramos_por_libra: String(GRAMOS_POR_LIBRA_DEFAULT),
      costo_compra_total: '',
      cantidad_compra: '',
    });
    this.formError = '';
    this.showFormModal = true;
  }

  openEditModal(insumo: Insumo): void {
    this.editingInsumoId = insumo.id_insumo;
    this.costoGuardadoActual = insumo.costo_unitario;
    this.insumoForm.reset({
      nombre: insumo.nombre,
      unidad_medida: insumo.unidad_medida as UnidadMedida,
      stock_actual: String(insumo.stock_actual),
      stock_minimo: String(insumo.stock_minimo),
      costo_por_unidad: insumo.unidad_medida === 'UNIDAD' ? String(insumo.costo_unitario) : '',
      precio_por_libra: '',
      gramos_por_libra: String(GRAMOS_POR_LIBRA_DEFAULT),
      costo_compra_total: '',
      cantidad_compra: '',
    });
    this.formError = '';
    this.showFormModal = true;
  }

  closeFormModal(): void {
    if (this.saving) return;
    this.showFormModal = false;
    this.editingInsumoId = null;
    this.costoGuardadoActual = null;
    this.formError = '';
    this.insumoForm.reset();
  }

  submitForm(): void {
    if (this.insumoForm.invalid) {
      this.insumoForm.markAllAsTouched();
      return;
    }

    const costoUnitario = this.resolveCostoUnitario(true);
    if (costoUnitario == null) {
      this.formError = 'Completa los datos de costo de compra';
      return;
    }

    const { nombre, unidad_medida, stock_actual, stock_minimo } = this.insumoForm.getRawValue();
    const payload = {
      nombre: nombre!,
      unidad_medida: unidad_medida as UnidadMedida,
      stock_actual: Number(stock_actual),
      stock_minimo: Number(stock_minimo),
      costo_unitario: costoUnitario,
    };

    this.saving = true;
    this.formError = '';
    const wasEditing = this.isEditing;

    const request$ = wasEditing
      ? this.insumoService.actualizarInsumo(this.editingInsumoId!, payload)
      : this.insumoService.crearInsumo(payload);

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.showFormModal = false;
        this.editingInsumoId = null;
        this.costoGuardadoActual = null;
        this.insumoForm.reset();
        this.page = 1;
        this.loadInsumos();
        this.notification.success(
          wasEditing ? 'Insumo actualizado correctamente' : 'Insumo creado correctamente'
        );
      },
      error: (err) => {
        this.saving = false;
        const message =
          err?.message ??
          (wasEditing ? 'Error al actualizar el insumo' : 'Error al crear el insumo');
        this.formError = message;
        this.notification.error(message);
      },
    });
  }

  loadInsumos(): void {
    this.loading = true;
    this.errorMessage = '';

    this.insumoService
      .getInsumos({
        search: this.searchControl.value,
        page: this.page,
        pageSize: this.pageSize,
      })
      .subscribe({
        next: (result) => {
          this.insumos = result.items;
          this.totalItems = result.total;
          this.page = result.page;
          this.pageSize = result.pageSize;
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err?.message ?? 'Error al cargar los insumos';
          this.insumos = [];
          this.totalItems = 0;
        },
      });
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadInsumos();
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize = pageSize;
    this.page = 1;
    this.loadInsumos();
  }

  isStockBajo(insumo: Insumo): boolean {
    return this.insumoService.isStockBajo(insumo);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value);
  }

  formatCostoConUnidad(insumo: Insumo): string {
    return this.formatCostoPorUnidad(insumo.costo_unitario, String(insumo.unidad_medida));
  }

  formatCostoPorUnidad(costo: number, unidad: string): string {
    return `${this.formatCurrency(costo)} / ${unidadMedidaCorta(unidad)}`;
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

  unidadLegible(unidad: string): string {
    return unidadMedidaLegible(unidad);
  }

  private resolveCostoUnitario(markInvalid: boolean): number | null {
    const unidad = this.unidadSeleccionada;

    if (unidad === 'UNIDAD') {
      const valor = Number(this.insumoForm.get('costo_por_unidad')?.value);
      if (!valor && valor !== 0) {
        if (markInvalid) this.insumoForm.get('costo_por_unidad')?.setErrors({ required: true });
        return null;
      }
      return valor;
    }

    if (unidad === 'GRAMO') {
      const precioLibra = Number(this.insumoForm.get('precio_por_libra')?.value);
      const gramosLibra = Number(this.insumoForm.get('gramos_por_libra')?.value);
      if (!precioLibra || precioLibra <= 0 || !gramosLibra || gramosLibra <= 0) {
        if (markInvalid) {
          if (!precioLibra || precioLibra <= 0) {
            this.insumoForm.get('precio_por_libra')?.setErrors({ min: true });
          }
          if (!gramosLibra || gramosLibra <= 0) {
            this.insumoForm.get('gramos_por_libra')?.setErrors({ min: true });
          }
        }
        return null;
      }
      return calcularCostoPorGramoDesdeLibra(precioLibra, gramosLibra);
    }

    if (unidad === 'MILILITRO' || unidad === 'LITRO') {
      const total = Number(this.insumoForm.get('costo_compra_total')?.value);
      const cantidad = Number(this.insumoForm.get('cantidad_compra')?.value);
      if (!total || total <= 0 || !cantidad || cantidad <= 0) {
        if (markInvalid) {
          if (!total || total <= 0) {
            this.insumoForm.get('costo_compra_total')?.setErrors({ min: true });
          }
          if (!cantidad || cantidad <= 0) {
            this.insumoForm.get('cantidad_compra')?.setErrors({ min: true });
          }
        }
        return null;
      }
      return calcularCostoPorUnidadMedida(total, cantidad);
    }

    return null;
  }

  private fieldError(
    controlName: string,
    messages: Record<string, string>
  ): string {
    const control = this.insumoForm.get(controlName);
    if (!control?.touched || !control.errors) return '';

    for (const key of Object.keys(messages)) {
      if (control.errors[key]) return messages[key];
    }

    return '';
  }
}
