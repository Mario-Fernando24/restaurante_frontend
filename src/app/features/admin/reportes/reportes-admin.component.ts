import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ChartConfiguration } from 'chart.js';
import { forkJoin, Subject } from 'rxjs';
import { finalize, takeUntil, timeout } from 'rxjs/operators';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { ChartCanvasComponent } from '../../../shared/components/chart-canvas/chart-canvas.component';
import { Arqueo } from '../../caja/models/arqueo.model';
import { ArqueoService } from '../../caja/services/arqueo.service';
import { Cliente } from '../clientes/models/cliente.model';
import { ClienteService } from '../clientes/services/cliente.service';
import { ReporteAdministrativo } from './models/reporte.model';
import { ReporteService } from './services/reporte.service';
import {
  buildCategoriasChart,
  buildClientesChart,
  buildFlujoCajaChart,
  buildGastosChart,
  buildMetodosPagoChart,
  buildProductosChart,
  buildProveedoresChart,
  buildUtilidadChart,
  buildVentasPorDiaChart,
  buildVentasPorHoraChart,
  formatReporteCurrency,
  formatReportePercent,
} from './utils/reporte-charts.util';

type PeriodPreset = 'hoy' | 'semana' | 'mes' | 'trimestre';

interface KpiCard {
  label: string;
  value: string;
  hint: string;
  tone: 'default' | 'positive' | 'negative' | 'warning';
}

@Component({
  selector: 'app-reportes-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, ChartCanvasComponent],
  templateUrl: './reportes-admin.component.html',
  styleUrls: ['./reportes-admin.component.scss'],
})
export class ReportesAdminComponent implements OnInit, OnDestroy {
  reporte: ReporteAdministrativo | null = null;
  clientes: Cliente[] = [];
  proveedores: Cliente[] = [];
  arqueos: Arqueo[] = [];
  loading = true;
  loadingReport = false;
  errorMessage = '';
  activePreset: PeriodPreset = 'mes';

  chartVentasDia?: ChartConfiguration;
  chartVentasHora?: ChartConfiguration;
  chartMetodos?: ChartConfiguration;
  chartCategorias?: ChartConfiguration;
  chartProductos?: ChartConfiguration;
  chartClientes?: ChartConfiguration;
  chartGastos?: ChartConfiguration;
  chartProveedores?: ChartConfiguration;
  chartFlujo?: ChartConfiguration;
  chartUtilidad?: ChartConfiguration;
  chartsReady = false;

  readonly presets: { id: PeriodPreset; label: string }[] = [
    { id: 'hoy', label: 'Hoy' },
    { id: 'semana', label: '7 días' },
    { id: 'mes', label: 'Este mes' },
    { id: 'trimestre', label: '90 días' },
  ];

  readonly filterForm = this.fb.group({
    fecha_desde: [''],
    fecha_hasta: [''],
    id_cliente: [''],
    id_arqueo: [''],
    id_proveedor: [''],
  });

  private readonly destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private reporteService: ReporteService,
    private clienteService: ClienteService,
    private arqueoService: ArqueoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loading = false;
    this.applyPreset('mes');
    this.loadFilters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get kpis(): KpiCard[] {
    if (!this.reporte) return [];
    const r = this.reporte.resumen;
    const utilidad = Number(r.utilidad_neta_estimada);
    return [
      {
        label: 'Ingresos cobrados',
        value: formatReporteCurrency(r.ingresos_cobrados),
        hint: `${r.cantidad_ventas} ventas · ticket ${formatReporteCurrency(r.ticket_promedio)}`,
        tone: 'positive',
      },
      {
        label: 'Utilidad neta estimada',
        value: formatReporteCurrency(r.utilidad_neta_estimada),
        hint: `Margen ${formatReportePercent(r.margen_porcentaje)}`,
        tone: utilidad >= 0 ? 'positive' : 'negative',
      },
      {
        label: 'Compras inventario',
        value: formatReporteCurrency(r.total_compras),
        hint: `Util. potencial ${formatReporteCurrency(r.utilidad_potencial_compras)}`,
        tone: 'default',
      },
      {
        label: 'Gastos operativos',
        value: formatReporteCurrency(r.total_gastos),
        hint: `Nómina ${formatReporteCurrency(r.gastos_nomina)} · Admin ${formatReporteCurrency(r.gastos_administrativos)}`,
        tone: 'warning',
      },
      {
        label: 'Cortesías',
        value: formatReporteCurrency(r.valor_cortesias),
        hint: `${r.cantidad_cortesias} comprobantes (valor referencial)`,
        tone: 'default',
      },
    ];
  }

  applyPreset(preset: PeriodPreset): void {
    this.activePreset = preset;
    const hoy = new Date();
    const hasta = this.toInputDate(hoy);
    let desde = new Date(hoy);

    if (preset === 'hoy') {
      // mismo día
    } else if (preset === 'semana') {
      desde.setDate(desde.getDate() - 6);
    } else if (preset === 'mes') {
      desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    } else {
      desde.setDate(desde.getDate() - 89);
    }

    this.filterForm.patchValue({
      fecha_desde: this.toInputDate(desde),
      fecha_hasta: hasta,
    });
    this.loadReporte();
  }

  submitFilters(): void {
    this.activePreset = 'mes';
    this.loadReporte();
  }

  clearFilters(): void {
    this.filterForm.patchValue({
      id_cliente: '',
      id_arqueo: '',
      id_proveedor: '',
    });
    this.applyPreset('mes');
  }

  imprimir(): void {
    window.print();
  }

  formatCurrency = formatReporteCurrency;

  formatDate(value: string | null): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
  }

  private loadFilters(): void {
    forkJoin({
      clientes: this.clienteService.getClientes({ page: 1, pageSize: 500 }),
      arqueos: this.arqueoService.getArqueos({ page: 1, pageSize: 200 }),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ clientes, arqueos }) => {
          this.clientes = clientes.items.filter(
            (c) => c.estado.toLowerCase() === 'activo' && c.tipo_usuario.toUpperCase() === 'CLIENTE'
          );
          this.proveedores = clientes.items.filter(
            (c) => c.estado.toLowerCase() === 'activo' && c.tipo_usuario.toUpperCase() === 'PROVEEDOR'
          );
          this.arqueos = arqueos.items;
        },
        error: () => {
          // Los filtros son opcionales; el reporte puede cargarse sin ellos.
        },
      });
  }

  private loadReporte(): void {
    const values = this.filterForm.getRawValue();
    this.loadingReport = true;
    this.chartsReady = false;
    this.errorMessage = '';

    this.reporteService
      .getReporteAdministrativo({
        fecha_desde: values.fecha_desde || undefined,
        fecha_hasta: values.fecha_hasta || undefined,
        id_cliente: values.id_cliente ? Number(values.id_cliente) : undefined,
        id_arqueo: values.id_arqueo ? Number(values.id_arqueo) : undefined,
        id_proveedor: values.id_proveedor ? Number(values.id_proveedor) : undefined,
      })
      .pipe(
        timeout(30000),
        takeUntil(this.destroy$),
        finalize(() => {
          this.loadingReport = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (reporte) => {
          this.reporte = reporte;
          try {
            this.buildCharts(reporte);
            // Montar gráficas en el siguiente tick para no bloquear la UI ni el cierre del loading.
            setTimeout(() => {
              if (this.destroy$.closed) return;
              this.chartsReady = true;
              this.cdr.markForCheck();
            });
          } catch (error) {
            this.chartsReady = false;
            this.errorMessage =
              error instanceof Error
                ? error.message
                : 'No se pudieron generar las gráficas del reporte';
          }
        },
        error: (error: Error) => {
          this.reporte = null;
          this.chartsReady = false;
          this.errorMessage =
            error?.name === 'TimeoutError'
              ? 'El servidor tardó demasiado en responder. Verifica que Django esté corriendo y reinícialo.'
              : error.message || 'No se pudo cargar el reporte';
        },
      });
  }

  private buildCharts(reporte: ReporteAdministrativo): void {
    this.chartVentasDia = buildVentasPorDiaChart(reporte);
    this.chartVentasHora = buildVentasPorHoraChart(reporte);
    this.chartMetodos = buildMetodosPagoChart(reporte);
    this.chartCategorias = buildCategoriasChart(reporte);
    this.chartProductos = buildProductosChart(reporte);
    this.chartClientes = buildClientesChart(reporte);
    this.chartGastos = buildGastosChart(reporte);
    this.chartProveedores = buildProveedoresChart(reporte);
    this.chartFlujo = buildFlujoCajaChart(reporte);
    this.chartUtilidad = buildUtilidadChart(reporte);
  }

  private toInputDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
