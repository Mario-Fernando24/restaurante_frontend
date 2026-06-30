import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { ROUTES } from '../../../../core/routing/route-paths';
import { Empresa } from '../../../../core/models/empresa.model';
import { EmpresaService } from '../../../../core/services/empresa.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { Cliente } from '../../../admin/clientes/models/cliente.model';
import { ClienteService } from '../../../admin/clientes/services/cliente.service';
import { Producto } from '../../../admin/productos/models/producto.model';
import { ProductoService } from '../../../admin/productos/services/producto.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ThermalReceiptComponent } from '../../../../shared/thermal/thermal-receipt.component';
import { ThermalTicket } from '../../../../shared/thermal/thermal-ticket.model';
import { buildVentaTicket, printThermalTicket } from '../../../../shared/thermal/thermal-ticket.util';
import { Comanda } from '../../models/comanda.model';
import { Arqueo } from '../../models/arqueo.model';
import { MetodoPago, VentaPagoPayload } from '../../models/venta.model';
import { ArqueoService } from '../../services/arqueo.service';
import { ComandaService } from '../../services/comanda.service';
import { VentaService } from '../../services/venta.service';

interface CartItem {
  producto: Producto;
  cantidad: number;
}

interface ProductoGrupo {
  categoria: string;
  productos: Producto[];
}

@Component({
  selector: 'app-mesa-comanda',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonComponent,
    ThermalReceiptComponent,
  ],
  templateUrl: './mesa-comanda.component.html',
  styleUrls: ['../../pos/pos-page.component.scss', './mesa-comanda.component.scss'],
})
export class MesaComandaComponent implements OnInit, OnDestroy {
  readonly routes = ROUTES;

  idMesa = 0;
  mesaNombre = '';
  mesaZona = '';
  comanda: Comanda | null = null;

  arqueo: Arqueo | null = null;
  productos: Producto[] = [];
  clientes: Cliente[] = [];
  metodosPago: MetodoPago[] = [];
  cart: CartItem[] = [];
  empresa: Empresa | null = null;
  ticketImpresion: ThermalTicket | null = null;

  loading = true;
  saving = false;
  savedPulse = false;
  errorMessage = '';
  checkoutOpen = false;
  modoCortesia = false;
  submitting = false;
  searchTerm = '';

  readonly checkoutForm = this.fb.group({
    id_cliente: [''],
    observacion_cortesia: ['', Validators.maxLength(255)],
    pagos: this.fb.array([this.createPagoGroup()]),
  });

  private readonly destroy$ = new Subject<void>();
  private readonly save$ = new Subject<void>();
  private skipNextSave = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    readonly arqueoService: ArqueoService,
    private productoService: ProductoService,
    private clienteService: ClienteService,
    private ventaService: VentaService,
    private comandaService: ComandaService,
    private empresaService: EmpresaService,
    private notification: NotificationService,
    private confirmDialog: ConfirmDialogService
  ) {}

  ngOnInit(): void {
    this.idMesa = Number(this.route.snapshot.paramMap.get('idMesa'));

    this.save$
      .pipe(debounceTime(600), takeUntil(this.destroy$))
      .subscribe(() => this.persistCart());

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
    return this.cart.reduce((sum, item) => sum + item.producto.precio_venta * item.cantidad, 0);
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
    return !!this.arqueo && this.arqueoService.isAbierto(this.arqueo) && !!this.comanda;
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
      mesaData: this.comandaService.getComandaMesa(this.idMesa),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ arqueo, productos, clientes, metodos, empresa, mesaData }) => {
          this.arqueo = arqueo;
          this.empresa = empresa;
          this.mesaNombre = mesaData.mesa.numero;
          this.mesaZona = mesaData.mesa.zona;
          this.productos = productos.items.filter((p) => p.estado.toLowerCase() === 'activo');
          this.clientes = clientes.items.filter(
            (c) =>
              c.estado.toLowerCase() === 'activo' &&
              c.tipo_usuario.toUpperCase() === 'CLIENTE'
          );
          this.metodosPago = metodos;

          const applyComanda = (comanda: Comanda) => {
            this.comanda = comanda;
            this.hydrateCartFromComanda(comanda);
            this.loading = false;
          };

          if (mesaData.comanda) {
            applyComanda(mesaData.comanda);
            return;
          }

          this.comandaService.abrirComanda(this.idMesa).subscribe({
            next: applyComanda,
            error: (error: Error) => {
              this.errorMessage = error.message;
              this.loading = false;
            },
          });
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
    } else {
      this.cart = [...this.cart, { producto, cantidad: 1 }];
    }
    this.queueSave();
  }

  incrementItem(index: number): void {
    this.cart[index].cantidad += 1;
    this.cart = [...this.cart];
    this.queueSave();
  }

  decrementItem(index: number): void {
    if (this.cart[index].cantidad <= 1) {
      this.removeItem(index);
      return;
    }
    this.cart[index].cantidad -= 1;
    this.cart = [...this.cart];
    this.queueSave();
  }

  removeItem(index: number): void {
    this.cart = this.cart.filter((_, i) => i !== index);
    this.queueSave();
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
    const idCliente = this.comanda?.id_cliente ? String(this.comanda.id_cliente) : '';
    this.checkoutForm.patchValue({ id_cliente: idCliente, observacion_cortesia: '' });
  }

  closeCheckout(): void {
    this.checkoutOpen = false;
    this.modoCortesia = false;
  }

  liberarMesa(): void {
    if (!this.comanda) return;

    this.confirmDialog
      .open({
        title: '¿Liberar mesa?',
        message:
          'Se cancelará el pedido abierto y la mesa quedará libre para otro grupo.',
        confirmText: 'Sí, liberar',
        variant: 'danger',
        icon: 'warning',
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;

        this.comandaService.anularComanda(this.comanda!.id_comanda).subscribe({
          next: () => {
            this.notification.success('Mesa liberada');
            window.history.back();
          },
          error: (error: Error) => this.notification.error(error.message),
        });
      });
  }

  submitCobro(): void {
    if (!this.comanda || !this.arqueo || !this.canCheckout || !this.empresa) return;

    const observacionCortesia = this.checkoutForm.value.observacion_cortesia?.trim() ?? '';

    if (this.modoCortesia) {
      if (!observacionCortesia) {
        this.notification.error('Indica el motivo de la cortesía');
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
        this.notification.error('La suma de pagos debe coincidir con el total');
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
          if (value.referencia?.trim()) payload.referencia = value.referencia.trim();
          return payload;
        });

    this.submitting = true;
    this.skipNextSave = true;

    this.comandaService
      .cobrarComanda(this.comanda.id_comanda, {
        id_cliente: idCliente,
        detalle: [],
        pagos: this.modoCortesia ? undefined : pagos,
        es_cortesia: this.modoCortesia,
        observacion_cortesia: this.modoCortesia ? observacionCortesia : undefined,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ venta }) => {
          this.submitting = false;
          this.ticketImpresion = buildVentaTicket(venta, this.empresa!);
          this.closeCheckout();
          this.notification.success(
            `Mesa ${this.mesaNombre} cobrada · Venta #${venta.id_venta}`
          );
          printThermalTicket();
          setTimeout(() => window.history.back(), 800);
        },
        error: (error: Error) => {
          this.submitting = false;
          this.skipNextSave = false;
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

  getImagenUrl(imagen?: string): string | null {
    return this.productoService.getImagenUrl(imagen);
  }

  private hydrateCartFromComanda(comanda: Comanda): void {
    this.skipNextSave = true;
    this.cart = comanda.detalle
      .map((linea) => {
        const producto = this.productos.find((p) => p.id_producto === linea.id_producto);
        if (!producto) return null;
        return {
          producto,
          cantidad: Number(linea.cantidad),
        };
      })
      .filter((item): item is CartItem => item !== null);
    setTimeout(() => {
      this.skipNextSave = false;
    });
  }

  private queueSave(): void {
    if (this.skipNextSave || !this.comanda) return;
    this.save$.next();
  }

  private persistCart(): void {
    if (!this.comanda || this.skipNextSave) return;

    this.saving = true;
    const idClienteRaw = this.comanda.id_cliente;

    this.comandaService
      .actualizarItems(this.comanda.id_comanda, {
        detalle: this.cart.map((item) => ({
          id_producto: item.producto.id_producto,
          cantidad: item.cantidad,
        })),
        id_cliente: idClienteRaw,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (comanda) => {
          this.comanda = comanda;
          this.saving = false;
          this.savedPulse = true;
          setTimeout(() => (this.savedPulse = false), 1200);
        },
        error: (error: Error) => {
          this.saving = false;
          this.notification.error(error.message);
        },
      });
  }
}
