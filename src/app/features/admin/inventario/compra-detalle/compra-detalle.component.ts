import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ROUTES } from '../../../../core/routing/route-paths';
import { Empresa } from '../../../../core/models/empresa.model';
import { EmpresaService } from '../../../../core/services/empresa.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ThermalReceiptComponent } from '../../../../shared/thermal/thermal-receipt.component';
import { ThermalTicket } from '../../../../shared/thermal/thermal-ticket.model';
import { buildCompraTicket, printThermalTicket } from '../../../../shared/thermal/thermal-ticket.util';
import {
  CompraComprobante,
  CompraDetalleLinea,
  CompraMovimientoDetalle,
  CompraRegistrada,
} from '../models/compra.model';
import { CompraInventarioService } from '../services/compra-inventario.service';
import {
  buildComprobanteFromCompra,
  formatCompraCurrency,
  formatCompraDate,
  folioCompra,
  formatCantidadCompra,
  nombreDetalleLinea,
  compraTieneVentaDirecta,
  tipoDetalleLinea,
} from '../utils/compra-comprobante.util';
import { unidadMedidaLegible } from '../../insumos/utils/insumo-costo.util';

@Component({
  selector: 'app-compra-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink, ThermalReceiptComponent],
  templateUrl: './compra-detalle.component.html',
  styleUrls: ['./compra-detalle.component.scss'],
})
export class CompraDetalleComponent implements OnInit, OnDestroy {
  readonly routes = ROUTES;

  compra: CompraRegistrada | null = null;
  movimientos: CompraMovimientoDetalle[] = [];
  comprobanteImpresion: CompraComprobante | null = null;
  ticketImpresion: ThermalTicket | null = null;
  empresa: Empresa | null = null;
  loading = true;
  errorMessage = '';

  private readonly destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private compraService: CompraInventarioService,
    private empresaService: EmpresaService,
    private notification: NotificationService
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

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const id = Number(params.get('id'));
      if (!id) {
        this.errorMessage = 'Compra no válida';
        this.loading = false;
        return;
      }
      this.loadDetalle(id);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDetalle(idCompra: number): void {
    this.loading = true;
    this.errorMessage = '';

    this.compraService
      .getCompraDetalle(idCompra)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.compra = result.compra;
          this.movimientos = result.movimientos;
          this.comprobanteImpresion = buildComprobanteFromCompra(result.compra);
          this.actualizarTicket();
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err?.message ?? 'Error al cargar la compra';
          this.notification.error(this.errorMessage);
        },
      });
  }

  imprimir(): void {
    if (!this.ticketImpresion) return;
    printThermalTicket();
  }

  private actualizarTicket(): void {
    if (!this.comprobanteImpresion || !this.empresa) {
      this.ticketImpresion = null;
      return;
    }
    this.ticketImpresion = buildCompraTicket(this.comprobanteImpresion, this.empresa);
  }

  formatCurrency(value: string | number): string {
    return formatCompraCurrency(Number(value));
  }

  formatDate(value: string): string {
    return formatCompraDate(value);
  }

  folio(idCompra: number): string {
    return folioCompra(idCompra);
  }

  nombreLinea(linea: CompraDetalleLinea): string {
    return nombreDetalleLinea(linea);
  }

  tipoLinea(linea: CompraDetalleLinea): string {
    return tipoDetalleLinea(linea);
  }

  unidadLabel(unidad?: string): string {
    return unidad ? unidadMedidaLegible(unidad) : 'unidad';
  }

  utilidadLinea(linea: CompraDetalleLinea): number | null {
    return linea.tipo === 'PRODUCTO_DIRECTO' ? Number(linea.utilidad_total) : null;
  }

  precioVentaLinea(linea: CompraDetalleLinea): number | null {
    return linea.tipo === 'PRODUCTO_DIRECTO' ? Number(linea.precio_venta) : null;
  }

  formatCantidadMovimiento(cantidad: string): string {
    return formatCantidadCompra(cantidad);
  }

  get tieneVentaDirecta(): boolean {
    return this.compra ? compraTieneVentaDirecta(this.compra.detalle) : false;
  }

  get tieneProductoEnMovimientos(): boolean {
    return this.movimientos.some((movimiento) => !!movimiento.producto_nombre);
  }
}
