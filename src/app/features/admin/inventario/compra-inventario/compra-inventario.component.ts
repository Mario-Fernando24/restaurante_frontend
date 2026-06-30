import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { ROUTES } from '../../../../core/routing/route-paths';
import { Empresa } from '../../../../core/models/empresa.model';
import { NotificationService } from '../../../../core/services/notification.service';
import { EmpresaService } from '../../../../core/services/empresa.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { ThermalReceiptComponent } from '../../../../shared/thermal/thermal-receipt.component';
import { ThermalTicket } from '../../../../shared/thermal/thermal-ticket.model';
import { buildCompraTicket, printThermalTicket } from '../../../../shared/thermal/thermal-ticket.util';
import { Cliente } from '../../clientes/models/cliente.model';
import { ClienteService } from '../../clientes/services/cliente.service';
import { Insumo } from '../../insumos/models/insumo.model';
import { InsumoService } from '../../insumos/services/insumo.service';
import { unidadMedidaLegible } from '../../insumos/utils/insumo-costo.util';
import { Producto } from '../../productos/models/producto.model';
import { ProductoService } from '../../productos/services/producto.service';
import { Receta } from '../../recetas/models/receta.model';
import { RecetaService } from '../../recetas/services/receta.service';
import { calcularMargenPorcentaje } from '../../recetas/utils/receta-costo.util';
import {
  CompraComprobante,
  CompraComprobanteLinea,
  CompraDetalleLinea,
  CompraResumen,
} from '../models/compra.model';
import {
  buildComprobanteFromCompra,
  formatCompraCurrency,
  formatCompraDate,
} from '../utils/compra-comprobante.util';
import { CompraInventarioService } from '../services/compra-inventario.service';

type CompraTab = 'directo' | 'preparado';

@Component({
  selector: 'app-compra-inventario',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonComponent,
    InputComponent,
    ThermalReceiptComponent,
  ],
  templateUrl: './compra-inventario.component.html',
  styleUrls: ['./compra-inventario.component.scss'],
})
export class CompraInventarioComponent implements OnInit, OnDestroy {
  readonly routes = ROUTES;

  proveedores: Cliente[] = [];
  productosDirectos: Producto[] = [];
  insumosPreparado: Insumo[] = [];
  loading = true;
  saving = false;
  errorMessage = '';
  formError = '';
  activeTab: CompraTab = 'directo';
  ultimoResumen: CompraResumen | null = null;
  ultimoDetalle: CompraDetalleLinea[] = [];
  comprobanteImpresion: CompraComprobante | null = null;
  ticketImpresion: ThermalTicket | null = null;
  empresa: Empresa | null = null;

  facturaPreviewUrl: string | null = null;
  facturaNombre = '';
  private facturaArchivo: File | null = null;

  readonly compraForm = this.fb.group({
    id_proveedor: [null as number | null, Validators.required],
    observacion: ['', Validators.maxLength(255)],
    lineasProductos: this.fb.array([this.createLineaProductoGroup()]),
    lineasInsumos: this.fb.array([this.createLineaInsumoGroup()]),
  });

  private recetas: Receta[] = [];
  private productos: Producto[] = [];
  private readonly destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private clienteService: ClienteService,
    private productoService: ProductoService,
    private insumoService: InsumoService,
    private recetaService: RecetaService,
    private compraService: CompraInventarioService,
    private empresaService: EmpresaService,
    private notification: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.empresaService
      .getEmpresa()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (empresa) => {
          this.empresa = empresa;
          this.actualizarTicket();
        },
      });

    this.syncTabsValidation();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.revokeFacturaPreview();
  }

  get lineasProductos(): FormArray {
    return this.compraForm.get('lineasProductos') as FormArray;
  }

  get lineasInsumos(): FormArray {
    return this.compraForm.get('lineasInsumos') as FormArray;
  }

  setTab(tab: CompraTab): void {
    this.activeTab = tab;
    this.formError = '';
    this.syncTabsValidation();
  }

  private syncTabsValidation(): void {
    if (this.activeTab === 'directo') {
      this.lineasInsumos.disable({ emitEvent: false });
      this.lineasProductos.enable({ emitEvent: false });
      return;
    }

    this.lineasProductos.disable({ emitEvent: false });
    this.lineasInsumos.enable({ emitEvent: false });
  }

  addLineaProducto(): void {
    this.lineasProductos.push(this.createLineaProductoGroup());
  }

  removeLineaProducto(index: number): void {
    if (this.lineasProductos.length === 1) return;
    this.lineasProductos.removeAt(index);
  }

  addLineaInsumo(): void {
    this.lineasInsumos.push(this.createLineaInsumoGroup());
  }

  removeLineaInsumo(index: number): void {
    if (this.lineasInsumos.length === 1) return;
    this.lineasInsumos.removeAt(index);
  }

  onFacturaSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;

    if (!archivo.type.startsWith('image/')) {
      this.notification.error('Solo se permiten imágenes de la factura');
      input.value = '';
      return;
    }

    if (archivo.size > 8 * 1024 * 1024) {
      this.notification.error('La imagen no puede superar 8 MB');
      input.value = '';
      return;
    }

    this.revokeFacturaPreview();
    this.facturaArchivo = archivo;
    this.facturaNombre = archivo.name;
    this.facturaPreviewUrl = URL.createObjectURL(archivo);
  }

  quitarFactura(): void {
    this.revokeFacturaPreview();
    this.facturaArchivo = null;
    this.facturaNombre = '';
  }

  getProducto(id: number | null | undefined): Producto | undefined {
    if (id == null) return undefined;
    return this.productosDirectos.find((producto) => producto.id_producto === Number(id));
  }

  getInsumo(id: number | null | undefined): Insumo | undefined {
    if (id == null) return undefined;
    return this.insumosPreparado.find((insumo) => insumo.id_insumo === Number(id));
  }

  getProveedorNombre(id: number | null | undefined): string {
    if (id == null) return 'Sin proveedor';
    const proveedor = this.proveedores.find((item) => item.id_cliente === Number(id));
    return proveedor ? `${proveedor.nombre} ${proveedor.apellido}`.trim() : 'Sin proveedor';
  }

  unidadLabel(unidad?: string): string {
    return unidad ? unidadMedidaLegible(unidad) : 'unidad';
  }

  utilidadUnitariaLinea(index: number): number | null {
    const control = this.lineasProductos.at(index);
    const idProducto = control.get('id_producto')?.value;
    const costo = Number(control.get('costo_unitario')?.value);
    const producto = this.getProducto(idProducto);
    if (!producto || Number.isNaN(costo)) return null;
    return producto.precio_venta - costo;
  }

  margenLinea(index: number): number | null {
    const utilidad = this.utilidadUnitariaLinea(index);
    const producto = this.getProducto(this.lineasProductos.at(index).get('id_producto')?.value);
    if (utilidad == null || !producto) return null;
    return calcularMargenPorcentaje(producto.precio_venta, utilidad);
  }

  utilidadTotalPreview(): number {
    return this.lineasProductos.controls.reduce((total, control, index) => {
      const cantidad = Number(control.get('cantidad')?.value);
      const utilidad = this.utilidadUnitariaLinea(index);
      if (utilidad == null || Number.isNaN(cantidad)) return total;
      return total + utilidad * cantidad;
    }, 0);
  }

  costoTotalPreview(): number {
    let total = 0;

    this.lineasProductos.controls.forEach((control) => {
      const cantidad = Number(control.get('cantidad')?.value);
      const costo = Number(control.get('costo_unitario')?.value);
      if (!Number.isNaN(cantidad) && !Number.isNaN(costo)) {
        total += cantidad * costo;
      }
    });

    this.lineasInsumos.controls.forEach((control) => {
      const cantidad = Number(control.get('cantidad')?.value);
      const costoRaw = control.get('costo_unitario')?.value;
      const insumo = this.getInsumo(control.get('id_insumo')?.value);
      const costo =
        costoRaw === '' || costoRaw == null
          ? Number(insumo?.costo_unitario ?? 0)
          : Number(costoRaw);
      if (!Number.isNaN(cantidad) && !Number.isNaN(costo)) {
        total += cantidad * costo;
      }
    });

    return total;
  }

  puedeImprimirBorrador(): boolean {
    return this.construirLineasDesdeFormulario().length > 0;
  }

  imprimirBorrador(): void {
    const comprobante = this.construirComprobanteDesdeFormulario();
    if (!comprobante) {
      this.notification.error('Agrega al menos una línea para imprimir el borrador');
      return;
    }
    this.comprobanteImpresion = comprobante;
    this.actualizarTicket();
    this.ejecutarImpresion();
  }

  imprimirComprobante(): void {
    if (!this.ticketImpresion) return;
    this.ejecutarImpresion();
  }

  private actualizarTicket(): void {
    if (!this.comprobanteImpresion || !this.empresa) {
      this.ticketImpresion = null;
      return;
    }
    this.ticketImpresion = buildCompraTicket(this.comprobanteImpresion, this.empresa);
  }

  formatCurrency(value: number): string {
    return formatCompraCurrency(value);
  }

  formatDate(value: string): string {
    return formatCompraDate(value);
  }

  nombreDetalleLinea(linea: CompraDetalleLinea): string {
    return linea.tipo === 'PRODUCTO_DIRECTO' ? linea.producto : linea.insumo;
  }

  utilidadDetalleLinea(linea: CompraDetalleLinea): number | null {
    return linea.tipo === 'PRODUCTO_DIRECTO' ? Number(linea.utilidad_total) : null;
  }

  precioVentaDetalleLinea(linea: CompraDetalleLinea): number | null {
    return linea.tipo === 'PRODUCTO_DIRECTO' ? Number(linea.precio_venta) : null;
  }

  async submit(): Promise<void> {
    this.formError = '';

    const idProveedor = this.compraForm.get('id_proveedor')?.value;
    if (!idProveedor) {
      this.formError = 'Selecciona un proveedor';
      this.compraForm.get('id_proveedor')?.markAsTouched();
      this.notification.error(this.formError);
      return;
    }

    const errorLineas = this.validarLineasFormulario();
    if (errorLineas) {
      this.formError = errorLineas;
      this.notification.error(errorLineas);
      return;
    }

    const lineasProductos = this.extraerLineasProductos();
    const lineasInsumos = this.extraerLineasInsumos();

    if (lineasProductos.length === 0 && lineasInsumos.length === 0) {
      this.formError =
        'Agrega al menos una línea completa en productos directos o en insumos preparados';
      this.notification.error(this.formError);
      return;
    }

    const { observacion } = this.compraForm.getRawValue();

    this.saving = true;
    this.formError = '';
    this.ultimoResumen = null;
    this.ultimoDetalle = [];

    let facturaBase64: string | undefined;
    if (this.facturaArchivo) {
      try {
        facturaBase64 = await this.fileToBase64(this.facturaArchivo);
      } catch {
        this.saving = false;
        this.formError = 'No se pudo leer la imagen de la factura';
        this.notification.error(this.formError);
        return;
      }
    }

    this.compraService
      .registrarCompra({
        id_proveedor: Number(idProveedor),
        observacion: observacion?.trim() || undefined,
        factura_base64: facturaBase64,
        lineas_productos: lineasProductos.length ? lineasProductos : undefined,
        lineas_insumo: lineasInsumos.length ? lineasInsumos : undefined,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.saving = false;
          this.ultimoResumen = result.resumen;
          this.ultimoDetalle = result.detalle;
          this.comprobanteImpresion = buildComprobanteFromCompra(result.compra);
          this.actualizarTicket();

          const utilidad = Number(result.resumen.utilidad_potencial);
          const mensaje =
            lineasProductos.length > 0
              ? `Compra #${result.compra.id_compra} registrada. Utilidad potencial: ${this.formatCurrency(utilidad)}`
              : `Compra #${result.compra.id_compra} registrada: ${result.movimientos.length} entrada(s)`;

          this.notification.success(mensaje);
          this.router.navigate([
            ROUTES.ADMIN_INVENTARIO_COMPRAS,
            result.compra.id_compra,
          ]);
        },
        error: (err) => {
          this.saving = false;
          this.formError = err?.message ?? 'Error al registrar la compra';
          this.notification.error(this.formError);
        },
      });
  }

  loadData(): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      proveedores: this.clienteService.getClientes({ page: 1, pageSize: 500 }),
      productos: this.productoService.getProductos({ page: 1, pageSize: 1000 }),
      insumos: this.insumoService.getInsumos({ page: 1, pageSize: 1000 }),
      recetas: this.recetaService.getRecetas({ page: 1, pageSize: 10000 }),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ proveedores, productos, insumos, recetas }) => {
          this.proveedores = proveedores.items.filter(
            (cliente) => cliente.tipo_usuario === 'PROVEEDOR' && cliente.estado === 'Activo'
          );
          this.productos = productos.items;
          this.recetas = recetas.items;
          this.productosDirectos = productos.items.filter(
            (producto) =>
              producto.tipo_producto === 'VENTA_DIRECTA' && producto.estado === 'Activo'
          );
          this.insumosPreparado = insumos.items.filter(
            (insumo) =>
              insumo.estado === 'Activo' && !this.esInsumoSoloVentaDirecta(insumo.id_insumo)
          );
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err?.message ?? 'Error al cargar datos';
        },
      });
  }

  private construirComprobanteDesdeFormulario(): CompraComprobante | null {
    const lineas = this.construirLineasDesdeFormulario();
    if (lineas.length === 0) return null;

    const { id_proveedor, observacion } = this.compraForm.getRawValue();
    const usuario = this.auth.getCurrentUser();
    const registradoPor = usuario
      ? `${usuario.nombre} ${usuario.apellido}`.trim()
      : undefined;

    const totalCosto = lineas.reduce((sum, linea) => sum + linea.subtotal, 0);
    const totalVentaPotencial = lineas.reduce(
      (sum, linea) => sum + (linea.precioVenta ?? 0) * Number(linea.cantidad),
      0
    );
    const utilidadPotencial = lineas.reduce(
      (sum, linea) => sum + (linea.utilidadTotal ?? 0),
      0
    );

    return {
      folio: 'BORRADOR',
      esBorrador: true,
      fecha: new Date().toISOString(),
      proveedor: this.getProveedorNombre(id_proveedor),
      observacion: observacion?.trim() ?? '',
      registradoPor,
      lineas,
      totalCosto,
      totalVentaPotencial,
      utilidadPotencial,
      facturaUrl: this.facturaPreviewUrl ?? undefined,
    };
  }

  private construirLineasDesdeFormulario(): CompraComprobanteLinea[] {
    const lineas: CompraComprobanteLinea[] = [];
    let numero = 1;

    this.lineasProductos.controls.forEach((control) => {
      const idProducto = Number(control.get('id_producto')?.value);
      const cantidad = Number(control.get('cantidad')?.value);
      const costoUnitario = Number(control.get('costo_unitario')?.value);
      const producto = this.getProducto(idProducto);
      if (!producto || !cantidad || Number.isNaN(costoUnitario)) return;

      const utilidadUnitaria = producto.precio_venta - costoUnitario;
      lineas.push({
        numero: numero++,
        descripcion: producto.nombre,
        tipo: 'Venta directa',
        cantidad: String(cantidad),
        unidad: 'unidad',
        costoUnitario,
        subtotal: cantidad * costoUnitario,
        precioVenta: producto.precio_venta,
        utilidadTotal: utilidadUnitaria * cantidad,
      });
    });

    this.lineasInsumos.controls.forEach((control) => {
      const idInsumo = Number(control.get('id_insumo')?.value);
      const cantidad = Number(control.get('cantidad')?.value);
      const costoRaw = control.get('costo_unitario')?.value;
      const insumo = this.getInsumo(idInsumo);
      if (!insumo || !cantidad) return;

      const costoUnitario =
        costoRaw === '' || costoRaw == null
          ? Number(insumo.costo_unitario)
          : Number(costoRaw);
      if (Number.isNaN(costoUnitario)) return;

      lineas.push({
        numero: numero++,
        descripcion: insumo.nombre,
        tipo: 'Insumo preparado',
        cantidad: String(cantidad),
        unidad: insumo.unidad_medida,
        costoUnitario,
        subtotal: cantidad * costoUnitario,
      });
    });

    return lineas;
  }

  private ejecutarImpresion(): void {
    printThermalTicket();
  }

  private esInsumoSoloVentaDirecta(idInsumo: number): boolean {
    const recetasInsumo = this.recetas.filter((receta) => receta.id_insumo === idInsumo);
    if (recetasInsumo.length === 0) return false;

    return recetasInsumo.every((receta) => {
      const producto = this.productos.find((item) => item.id_producto === receta.id_producto);
      return producto?.tipo_producto === 'VENTA_DIRECTA';
    });
  }

  private resetForm(): void {
    this.compraForm.patchValue({ id_proveedor: null, observacion: '' });
    this.lineasProductos.clear();
    this.lineasInsumos.clear();
    this.lineasProductos.push(this.createLineaProductoGroup());
    this.lineasInsumos.push(this.createLineaInsumoGroup());
    this.quitarFactura();
    this.syncTabsValidation();
  }

  private revokeFacturaPreview(): void {
    if (this.facturaPreviewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(this.facturaPreviewUrl);
    }
    this.facturaPreviewUrl = null;
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  private validarLineasFormulario(): string | null {
    for (const control of this.lineasProductos.controls) {
      const valores = this.valoresLineaProducto(control);
      if (!this.lineaTieneDatos(valores)) continue;
      if (!valores.id_producto || !valores.cantidad || valores.costo_unitario == null) {
        return 'Completa producto, cantidad y costo en cada línea de venta directa';
      }
      if (valores.cantidad <= 0) {
        return 'La cantidad de cada producto debe ser mayor a cero';
      }
      if (valores.costo_unitario < 0) {
        return 'El costo de compra no puede ser negativo';
      }
    }

    for (const control of this.lineasInsumos.controls) {
      const valores = this.valoresLineaInsumo(control);
      if (!this.lineaTieneDatos(valores)) continue;
      if (!valores.id_insumo || !valores.cantidad) {
        return 'Completa insumo y cantidad en cada línea de insumos preparados';
      }
      if (valores.cantidad <= 0) {
        return 'La cantidad de cada insumo debe ser mayor a cero';
      }
      if (valores.costo_unitario != null && valores.costo_unitario < 0) {
        return 'El costo del insumo no puede ser negativo';
      }
    }

    return null;
  }

  private extraerLineasProductos() {
    return this.lineasProductos.controls
      .map((control) => this.valoresLineaProducto(control))
      .filter(
        (linea) =>
          !!linea.id_producto &&
          (linea.cantidad ?? 0) > 0 &&
          linea.costo_unitario != null
      )
      .map((linea) => ({
        id_producto: linea.id_producto!,
        cantidad: linea.cantidad!,
        costo_unitario: linea.costo_unitario!,
      }));
  }

  private extraerLineasInsumos() {
    return this.lineasInsumos.controls
      .map((control) => this.valoresLineaInsumo(control))
      .filter((linea) => !!linea.id_insumo && (linea.cantidad ?? 0) > 0)
      .map((linea) => ({
        id_insumo: linea.id_insumo!,
        cantidad: linea.cantidad!,
        costo_unitario: linea.costo_unitario,
      }));
  }

  private valoresLineaProducto(control: { get: (name: string) => { value: unknown } | null }) {
    const costoRaw = control.get('costo_unitario')?.value;
    return {
      id_producto: control.get('id_producto')?.value
        ? Number(control.get('id_producto')?.value)
        : null,
      cantidad: control.get('cantidad')?.value ? Number(control.get('cantidad')?.value) : null,
      costo_unitario:
        costoRaw === '' || costoRaw == null ? null : Number(costoRaw),
    };
  }

  private valoresLineaInsumo(control: { get: (name: string) => { value: unknown } | null }) {
    const costoRaw = control.get('costo_unitario')?.value;
    return {
      id_insumo: control.get('id_insumo')?.value
        ? Number(control.get('id_insumo')?.value)
        : null,
      cantidad: control.get('cantidad')?.value ? Number(control.get('cantidad')?.value) : null,
      costo_unitario:
        costoRaw === '' || costoRaw == null ? undefined : Number(costoRaw),
    };
  }

  private lineaTieneDatos(linea: Record<string, unknown>): boolean {
    return Object.values(linea).some(
      (valor) => valor !== null && valor !== undefined && valor !== ''
    );
  }

  private createLineaProductoGroup() {
    return this.fb.group({
      id_producto: [null as number | null],
      cantidad: ['', [Validators.min(0.001)]],
      costo_unitario: ['', [Validators.min(0)]],
    });
  }

  private createLineaInsumoGroup() {
    return this.fb.group({
      id_insumo: [null as number | null],
      cantidad: ['', [Validators.min(0.001)]],
      costo_unitario: ['', [Validators.min(0)]],
    });
  }
}
