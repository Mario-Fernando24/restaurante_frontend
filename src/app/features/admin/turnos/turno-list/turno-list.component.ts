import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { PaginatorComponent } from '../../../../shared/components/paginator/paginator.component';
import {
  Arqueo,
  METODO_PAGO_LABELS,
  TurnoDetalle,
} from '../../../caja/models/arqueo.model';
import { ArqueoService } from '../../../caja/services/arqueo.service';

@Component({
  selector: 'app-turno-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PaginatorComponent],
  templateUrl: './turno-list.component.html',
  styleUrls: ['./turno-list.component.scss'],
})
export class TurnoListComponent implements OnInit, OnDestroy {
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly turnoSelect = new FormControl<number | null>(null);
  readonly pageSizeOptions = [5, 10, 25, 50];
  readonly metodoLabels = METODO_PAGO_LABELS;

  turnos: Arqueo[] = [];
  turnosSelector: Arqueo[] = [];
  detalle: TurnoDetalle | null = null;
  selectedId: number | null = null;

  loading = false;
  loadingDetalle = false;
  errorMessage = '';
  detalleError = '';

  page = 1;
  pageSize = 10;
  totalItems = 0;

  private readonly destroy$ = new Subject<void>();

  constructor(private arqueoService: ArqueoService) {}

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.page = 1;
        this.loadTurnos();
      });

    this.turnoSelect.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((id) => {
      if (id != null) {
        this.seleccionarTurno(id);
      }
    });

    this.loadTurnos();
    this.loadTurnosSelector();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTurnosSelector(): void {
    this.arqueoService
      .getArqueos({ page: 1, pageSize: 500 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.turnosSelector = result.items;
        },
        error: () => {
          this.turnosSelector = [];
        },
      });
  }

  loadTurnos(): void {
    this.loading = true;
    this.errorMessage = '';

    this.arqueoService
      .getArqueos({
        search: this.searchControl.value,
        page: this.page,
        pageSize: this.pageSize,
      })
      .subscribe({
        next: (result) => {
          this.turnos = result.items;
          this.totalItems = result.total;
          this.page = result.page;
          this.pageSize = result.pageSize;
          this.loading = false;

          if (this.selectedId && !this.turnos.some((t) => t.id_arqueo === this.selectedId)) {
            this.selectedId = null;
            this.detalle = null;
            this.turnoSelect.setValue(null, { emitEvent: false });
          }
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err?.message ?? 'Error al cargar el historial de turnos';
          this.turnos = [];
          this.totalItems = 0;
        },
      });
  }

  seleccionarTurno(id: number): void {
    if (this.selectedId === id && this.detalle) {
      return;
    }

    this.selectedId = id;
    this.turnoSelect.setValue(id, { emitEvent: false });
    this.loadingDetalle = true;
    this.detalleError = '';
    this.detalle = null;

    this.arqueoService
      .getArqueoDetalle(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (detalle) => {
          this.detalle = detalle;
          this.loadingDetalle = false;
        },
        error: (err) => {
          this.loadingDetalle = false;
          this.detalleError = err?.message ?? 'Error al cargar el resumen del turno';
        },
      });
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadTurnos();
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize = pageSize;
    this.page = 1;
    this.loadTurnos();
  }

  isAbierto(estado: string): boolean {
    return estado.toLowerCase() === 'abierto';
  }

  isSelected(id: number): boolean {
    return this.selectedId === id;
  }

  getMetodoLabel(metodo: string): string {
    return this.metodoLabels[metodo] ?? metodo;
  }

  getTurnoLabel(turno: Arqueo): string {
    const cajero = turno.cajero ?? `Usuario #${turno.id_usuario ?? '?'}`;
    return `#${turno.id_arqueo} · ${cajero} · ${this.formatDate(turno.fecha_apertura)}`;
  }

  formatCurrency(value?: number): string {
    if (value == null) return '—';
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
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatTime(value?: string): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getDiferenciaLabel(diferencia?: number): string {
    if (diferencia == null) return '—';
    if (diferencia > 0) return 'Sobrante';
    if (diferencia < 0) return 'Faltante';
    return 'Cuadrado';
  }

  getProductosVenta(venta: TurnoDetalle['ventas'][number]): string {
    return venta.detalle.map((linea) => `${linea.producto} x${linea.cantidad}`).join(', ');
  }

  getPagosVenta(venta: TurnoDetalle['ventas'][number]): string {
    return venta.pagos
      .map((pago) => `${this.getMetodoLabel(pago.metodo_pago)} ${this.formatCurrency(pago.monto)}`)
      .join(' · ');
  }
}
