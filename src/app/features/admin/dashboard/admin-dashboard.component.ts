import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, of, Subject } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { ROUTES } from '../../../core/routing/route-paths';
import { AuditoriaRegistro } from '../auditoria/models/auditoria.model';
import { AuditoriaService } from '../auditoria/services/auditoria.service';
import { CategoriaService } from '../categorias/services/categoria.service';
import { InsumoService } from '../insumos/services/insumo.service';
import { MovimientoInventario } from '../inventario/models/movimiento.model';
import { MovimientoService } from '../inventario/services/movimiento.service';
import { ProductoService } from '../productos/services/producto.service';
import { ArqueoService } from '../../caja/services/arqueo.service';

type PeriodFilter = 'hoy' | 'semana' | 'mes';

interface KpiCard {
  label: string;
  value: string;
  badge: string;
  icon: string;
  alert?: boolean;
  trend?: boolean;
}

interface RecentActivity {
  id: string;
  time: string;
  detail: string;
  amount: string;
  status: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  readonly routes = ROUTES;

  activePeriod: PeriodFilter = 'hoy';
  readonly todayLabel = this.formatTodayLabel();

  loading = true;
  errorMessage = '';

  kpis: KpiCard[] = [];
  recentActivity: RecentActivity[] = [];
  inventoryPercent = 0;

  readonly periods: { id: PeriodFilter; label: string }[] = [
    { id: 'hoy', label: 'Hoy' },
    { id: 'semana', label: 'Semana' },
    { id: 'mes', label: 'Mes' },
  ];

  // TODO: conectar gráfico cuando exista endpoint de ventas agregadas por día
  readonly chartDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  readonly chartHeights = [0, 0, 0, 0, 0, 0, 0];

  private readonly destroy$ = new Subject<void>();

  constructor(
    private categoriaService: CategoriaService,
    private productoService: ProductoService,
    private insumoService: InsumoService,
    private arqueoService: ArqueoService,
    private auditoriaService: AuditoriaService,
    private movimientoService: MovimientoService
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setPeriod(period: PeriodFilter): void {
    this.activePeriod = period;
  }

  loadDashboard(): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      categorias: this.categoriaService.getCategorias({ page: 1, pageSize: 500 }),
      productos: this.productoService.getProductos({ page: 1, pageSize: 500 }),
      insumos: this.insumoService.getInsumos({ page: 1, pageSize: 500 }),
      arqueos: this.arqueoService.getArqueos({ page: 1, pageSize: 500 }),
      auditoria: this.auditoriaService.getAuditoria({ page: 1, pageSize: 5 }).pipe(
        catchError(() => of({ items: [] as AuditoriaRegistro[], total: 0, page: 1, pageSize: 5 }))
      ),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ categorias, productos, insumos, arqueos, auditoria }) => {
          const categoriasActivas = categorias.items.filter(
            (c) => c.estado.toLowerCase() === 'activo'
          ).length;
          const productosActivos = productos.items.filter(
            (p) => p.estado.toLowerCase() === 'activo'
          ).length;
          const insumosStockBajo = insumos.items.filter((i) =>
            this.insumoService.isStockBajo(i)
          ).length;
          const arqueosAbiertos = arqueos.items.filter(
            (a) => a.estado.toLowerCase() === 'abierto'
          ).length;

          this.kpis = [
            {
              label: 'Categorías Activas',
              value: String(categoriasActivas),
              badge: 'En menú',
              icon: 'wallet',
            },
            {
              label: 'Arqueos Abiertos',
              value: String(arqueosAbiertos),
              badge: 'Activos',
              icon: 'register',
            },
            {
              label: 'Productos Activos',
              value: String(productosActivos),
              badge: 'En Catálogo',
              icon: 'box',
            },
            {
              label: 'Insumos Stock Bajo',
              value: String(insumosStockBajo),
              badge: 'Alerta',
              icon: 'alert',
              alert: insumosStockBajo > 0,
            },
          ];

          const totalInsumos = insumos.items.length;
          this.inventoryPercent =
            totalInsumos > 0
              ? Math.round(((totalInsumos - insumosStockBajo) / totalInsumos) * 100)
              : 0;

          if (auditoria.items.length > 0) {
            this.recentActivity = auditoria.items.map((item) => this.toAuditActivity(item));
          } else {
            this.loadRecentMovimientos();
            return;
          }

          this.loading = false;
        },
        error: (error: Error) => {
          this.errorMessage = error.message;
          this.loading = false;
        },
      });
  }

  private loadRecentMovimientos(): void {
    this.movimientoService
      .getMovimientos({ page: 1, pageSize: 5 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.recentActivity = result.items.map((item) => this.toMovimientoActivity(item));
          this.loading = false;
        },
        error: () => {
          this.recentActivity = [];
          this.loading = false;
        },
      });
  }

  private toAuditActivity(item: AuditoriaRegistro): RecentActivity {
    return {
      id: `#A-${item.id_auditoria}`,
      time: this.formatRelativeTime(item.fecha),
      detail: `${item.modulo} · ${item.accion}`,
      amount: item.tabla_afectada,
      status: item.nombre_usuario ?? 'Sistema',
    };
  }

  private toMovimientoActivity(item: MovimientoInventario): RecentActivity {
    return {
      id: `#M-${item.id_movimiento}`,
      time: this.formatRelativeTime(item.fecha_creacion),
      detail: `${item.tipo_movimiento} · ${item.nombre_insumo ?? 'Insumo'}`,
      amount: `${item.cantidad} uds`,
      status: item.nombre_usuario ?? 'Inventario',
    };
  }

  private formatRelativeTime(value: string): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Hace un momento';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `Hace ${diffHours} h`;
    return date.toLocaleDateString('es-CO', { dateStyle: 'medium' });
  }

  private formatTodayLabel(): string {
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
    ];
    const today = new Date();
    return `${today.getDate()} de ${months[today.getMonth()]}`;
  }
}
