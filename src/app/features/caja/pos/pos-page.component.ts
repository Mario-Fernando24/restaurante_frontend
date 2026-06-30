import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ROUTES } from '../../../core/routing/route-paths';
import { Empresa } from '../../../core/models/empresa.model';
import { EmpresaService } from '../../../core/services/empresa.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Cliente } from '../../admin/clientes/models/cliente.model';
import { ClienteService } from '../../admin/clientes/services/cliente.service';
import { Producto } from '../../admin/productos/models/producto.model';
import { ProductoService } from '../../admin/productos/services/producto.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { ThermalReceiptComponent } from '../../../shared/thermal/thermal-receipt.component';
import { ThermalTicket } from '../../../shared/thermal/thermal-ticket.model';
import { buildVentaTicket, printThermalTicket } from '../../../shared/thermal/thermal-ticket.util';
import { Arqueo } from '../models/arqueo.model';
import { MetodoPago, VentaPagoPayload } from '../models/venta.model';
import { ArqueoService } from '../services/arqueo.service';
import { VentaService } from '../services/venta.service';

interface CartItem {
  producto: Producto;
  cantidad: number;
}

interface ProductoGrupo {
  categoria: string;
  productos: Producto[];
}

@Component({
  selector: 'app-pos-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ButtonComponent, ThermalReceiptComponent],
  templateUrl: './pos-page.component.html',
  styleUrls: ['./pos-page.component.scss'],
})
export class PosPageComponent implements OnInit, OnDestroy {
  readonly routes = ROUTES;

  arqueo: Arqueo | null = null;
  productos: Producto[] = [];
  clientes: Cliente[] = [];
  metodosPago: MetodoPago[] = [];
  cart: CartItem[] = [];

  loading = true;
  errorMessage = '';
  checkoutOpen = false;
  modoCortesia = false;
  submitting = false;
  searchTerm = '';
  empresa: Empresa | null = null;
  ticketImpresion: ThermalTicket | null = null;

  readonly checkoutForm = this.fb.group({
    id_cliente: [''],
    observacion_cortesia: ['', Validators.maxLength(255)],
    pagos: this.fb.array([this.createPagoGroup()]),
  });

  private readonly destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    readonly arqueoService: ArqueoService,
    private productoService: ProductoService,
    private clienteService: ClienteService,
    private ventaService: VentaService,
    private empresaService: EmpresaService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get pagos(): FormArray {
    return this.checkoutForm.get('pagos') as FormArray;
  }

  get gruposProductos(): ProductoGrupo[] {
    const term = this.searchTerm.trim().toLowerCase();
    const filtered = this.productos.filter((p) => {
      if (!term) return true;
      return (
        p.nombre.toLowerCase().includes(term) ||
        (p.categoria_nombre ?? '').toLowerCase().includes(term)
      );
    });

    const map = new Map<string, Producto[]>();
    for (const producto of filtered) {
      const categoria = producto.categoria_nombre?.trim() || 'Sin categoría';
      const list = map.get(categoria) ?? [];
      list.push(producto);
      map.set(categoria, list);
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b, 'es'))
      .map(([categoria, productos]) => ({
        categoria,
        productos: productos.sort((x, y) => x.nombre.localeCompare(y.nombre, 'es')),
      }));
  }

  get cartSubtotal(): number {
    return this.cart.reduce(
      (sum, item) => sum + item.producto.precio_venta * item.cantidad,
      0
    );
  }

  get cartItemsCount(): number {
    return this.cart.reduce((sum, item) => sum + item.cantidad, 0);
  }

  get pagosTotal(): number {
    return this.pagos.controls.reduce((sum, control) => {
      const monto = Number(control.get('monto')?.value ?? 0);
      return sum + (Number.isFinite(monto) ? monto : 0);
    }, 0);
  }

  get canAddProducts(): boolean {
    return !!this.arqueo && this.arqueoService.isAbierto(this.arqueo);
  }

  get canCheckout(): boolean {
    return this.canAddProducts && this.cart.length > 0;
  }

  loadData(): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      arqueo: this.arqueoService.getArqueoActivo(),
      productos: this.productoService.getProductos({ page: 1, pageSize: 500 }),
      clientes: this.clienteService.getClientes({ page: 1, pageSize: 500 }),
      metodos: this.ventaService.getMetodosPago(),
      empresa: this.empresaService.getEmpresa(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ arqueo, productos, clientes, metodos, empresa }) => {
          this.arqueo = arqueo;
          this.empresa = empresa;
          this.productos = productos.items.filter(
            (p) => p.estado.toLowerCase() === 'activo'
          );
          this.clientes = clientes.items.filter(
            (c) =>
              c.estado.toLowerCase() === 'activo' &&
              c.tipo_usuario.toUpperCase() === 'CLIENTE'
          );
          this.metodosPago = metodos;
          this.loading = false;
        },
        error: (error: Error) => {
          this.errorMessage = error.message;
          this.loading = false;
        },
      });
  }

  createPagoGroup() {
    const defaultMetodo = this.metodosPago[0]?.metodo_pago ?? '';
    return this.fb.group({
      metodo_pago: [defaultMetodo, Validators.required],
      monto: ['', [Validators.required, Validators.min(0.01)]],
      referencia: [''],
    });
  }

  addPago(): void {
    this.pagos.push(this.createPagoGroup());
  }

  removePago(index: number): void {
    if (this.pagos.length <= 1) return;
    this.pagos.removeAt(index);
  }

  metodoRequiereReferencia(index: number): boolean {
    const code = String(this.pagos.at(index).get('metodo_pago')?.value ?? '');
    const metodo = this.metodosPago.find((m) => m.metodo_pago === code);
    return Boolean(metodo?.requiere_referencia);
  }

  addToCart(producto: Producto): void {
    const existing = this.cart.find((item) => item.producto.id_producto === producto.id_producto);
    if (existing) {
      existing.cantidad += 1;
      return;
    }
    this.cart = [...this.cart, { producto, cantidad: 1 }];
  }

  incrementItem(index: number): void {
    this.cart[index].cantidad += 1;
    this.cart = [...this.cart];
  }

  decrementItem(index: number): void {
    if (this.cart[index].cantidad <= 1) {
      this.removeItem(index);
      return;
    }
    this.cart[index].cantidad -= 1;
    this.cart = [...this.cart];
  }

  removeItem(index: number): void {
    this.cart = this.cart.filter((_, i) => i !== index);
  }

  clearCart(): void {
    this.cart = [];
    this.checkoutOpen = false;
    this.modoCortesia = false;
  }

  openCheckout(cortesia = false): void {
    if (!this.canCheckout) return;
    this.modoCortesia = cortesia;
    this.checkoutOpen = true;
    this.pagos.clear();
    if (!cortesia) {
      this.pagos.push(this.createPagoGroup());
      this.pagos.at(0).patchValue({ monto: this.cartSubtotal });
    }
    this.checkoutForm.patchValue({ id_cliente: '', observacion_cortesia: '' });
  }

  closeCheckout(): void {
    this.checkoutOpen = false;
    this.modoCortesia = false;
  }

  submitVenta(): void {
    if (!this.arqueo || !this.canCheckout || !this.empresa) return;

    const observacionCortesia = this.checkoutForm.value.observacion_cortesia?.trim() ?? '';

    if (this.modoCortesia) {
      if (!observacionCortesia) {
        this.notification.error('Indica el motivo de la cortesía (ej: La casa invita al cliente)');
        return;
      }
    } else {
      for (let i = 0; i < this.pagos.length; i++) {
        const group = this.pagos.at(i);
        if (group.invalid) {
          group.markAllAsTouched();
          return;
        }
        if (this.metodoRequiereReferencia(i) && !group.get('referencia')?.value?.trim()) {
          this.notification.error('Completa la referencia del método de pago');
          return;
        }
      }

      if (Math.abs(this.pagosTotal - this.cartSubtotal) > 0.01) {
        this.notification.error('La suma de pagos debe coincidir con el total de la venta');
        return;
      }
    }

    const idClienteRaw = this.checkoutForm.value.id_cliente;
    const idCliente = idClienteRaw ? Number(idClienteRaw) : undefined;

    const pagos: VentaPagoPayload[] = this.modoCortesia
      ? []
      : this.pagos.controls.map((control) => {
          const value = control.value;
          const payload: VentaPagoPayload = {
            metodo_pago: String(value.metodo_pago),
            monto: Number(value.monto),
          };
          if (value.referencia?.trim()) {
            payload.referencia = value.referencia.trim();
          }
          return payload;
        });

    this.submitting = true;

    this.ventaService
      .crearVenta({
        id_cliente: idCliente,
        detalle: this.cart.map((item) => ({
          id_producto: item.producto.id_producto,
          cantidad: item.cantidad,
        })),
        pagos: this.modoCortesia ? undefined : pagos,
        es_cortesia: this.modoCortesia,
        observacion_cortesia: this.modoCortesia ? observacionCortesia : undefined,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (venta) => {
          this.submitting = false;
          const fueCortesia = this.modoCortesia;
          this.ticketImpresion = buildVentaTicket(venta, this.empresa!);
          this.clearCart();
          const total = Number(venta.total);
          const mensaje = fueCortesia
            ? `Cortesía #${venta.id_venta} registrada (${this.formatCurrency(total)} referencial)`
            : `Venta #${venta.id_venta} registrada por ${this.formatCurrency(total)}`;
          this.notification.success(`${mensaje}. Imprimiendo ticket…`);
          printThermalTicket();
        },
        error: (error: Error) => {
          this.submitting = false;
          this.notification.error(error.message);
        },
      });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  formatDate(value: string): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  getImagenUrl(imagen?: string): string | null {
    return this.productoService.getImagenUrl(imagen);
  }
}
