import { ChartConfiguration } from 'chart.js';
import { METODO_PAGO_LABELS } from '../../../caja/models/arqueo.model';
import { GASTO_TIPO_LABELS, GastoTipo } from '../../../caja/models/gasto.model';
import { ReporteAdministrativo } from '../models/reporte.model';

export const CHART_COLORS = {
  primary: '#0d9488',
  primaryLight: '#5eead4',
  accent: '#c4a574',
  navy: '#1e3a5f',
  rose: '#e11d48',
  amber: '#d97706',
  slate: '#64748b',
  palette: [
    '#0d9488',
    '#1e3a5f',
    '#c4a574',
    '#2563eb',
    '#d97706',
    '#e11d48',
    '#7c3aed',
    '#059669',
    '#0891b2',
    '#be123c',
  ],
};

export function formatReporteCurrency(value: string | number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function formatReportePercent(value: string | number): string {
  return `${Number(value).toFixed(1)}%`;
}

export function metodoLabel(code: string): string {
  return METODO_PAGO_LABELS[code] ?? code.replace(/_/g, ' ');
}

export function gastoTipoLabel(tipo: string): string {
  return GASTO_TIPO_LABELS[tipo as GastoTipo] ?? tipo;
}

function baseOptions(title: string): ChartConfiguration['options'] {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { boxWidth: 12, font: { size: 11 } },
      },
      title: {
        display: true,
        text: title,
        font: { size: 13, weight: 'bold' },
        color: '#1e293b',
        padding: { bottom: 12 },
      },
    },
  };
}

export function buildVentasPorDiaChart(reporte: ReporteAdministrativo): ChartConfiguration {
  const labels = reporte.ventas_por_dia.map((item) => {
    if (!item.fecha) return '—';
    const date = new Date(item.fecha + 'T12:00:00');
    return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
  });
  const data = reporte.ventas_por_dia.map((item) => Number(item.total));

  return {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Ingresos',
          data,
          borderColor: CHART_COLORS.primary,
          backgroundColor: 'rgba(13, 148, 136, 0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: CHART_COLORS.primary,
        },
      ],
    },
    options: {
      ...baseOptions('Evolución de ventas por día'),
      scales: {
        y: {
          ticks: {
            callback: (value) => formatReporteCurrency(Number(value)),
          },
        },
      },
    },
  };
}

export function buildVentasPorHoraChart(reporte: ReporteAdministrativo): ChartConfiguration {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const map = new Map(reporte.ventas_por_hora.map((item) => [item.hora, Number(item.total)]));
  const labels = hours.map((h) => `${String(h).padStart(2, '0')}:00`);
  const data = hours.map((h) => map.get(h) ?? 0);

  return {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Ventas',
          data,
          backgroundColor: CHART_COLORS.navy,
          borderRadius: 4,
        },
      ],
    },
    options: {
      ...baseOptions('Ventas por hora del día'),
      scales: {
        y: {
          ticks: {
            callback: (value) => formatReporteCurrency(Number(value)),
          },
        },
      },
    },
  };
}

export function buildMetodosPagoChart(reporte: ReporteAdministrativo): ChartConfiguration {
  const labels = reporte.ventas_por_metodo_pago.map((item) => metodoLabel(item.metodo_pago));
  const data = reporte.ventas_por_metodo_pago.map((item) => Number(item.total));

  return {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: CHART_COLORS.palette.slice(0, data.length),
          borderWidth: 2,
          borderColor: '#fff',
        },
      ],
    },
    options: baseOptions('Distribución por método de pago'),
  };
}

export function buildCategoriasChart(reporte: ReporteAdministrativo): ChartConfiguration {
  const labels = reporte.ventas_por_categoria.map((item) => item.categoria);
  const data = reporte.ventas_por_categoria.map((item) => Number(item.total));

  return {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Ventas',
          data,
          backgroundColor: CHART_COLORS.accent,
          borderRadius: 4,
        },
      ],
    },
    options: {
      ...baseOptions('Ventas por categoría'),
      indexAxis: 'y',
      scales: {
        x: {
          ticks: {
            callback: (value) => formatReporteCurrency(Number(value)),
          },
        },
      },
    },
  };
}

export function buildProductosChart(reporte: ReporteAdministrativo): ChartConfiguration {
  const top = reporte.ventas_por_producto.slice(0, 10);
  const labels = top.map((item) => item.producto);
  const data = top.map((item) => Number(item.total));

  return {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Ventas',
          data,
          backgroundColor: CHART_COLORS.primary,
          borderRadius: 4,
        },
      ],
    },
    options: {
      ...baseOptions('Top 10 productos'),
      indexAxis: 'y',
      scales: {
        x: {
          ticks: {
            callback: (value) => formatReporteCurrency(Number(value)),
          },
        },
      },
    },
  };
}

export function buildClientesChart(reporte: ReporteAdministrativo): ChartConfiguration {
  const labels = reporte.top_clientes.map((item) => item.cliente);
  const data = reporte.top_clientes.map((item) => Number(item.total));

  return {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Compras',
          data,
          backgroundColor: CHART_COLORS.navy,
          borderRadius: 4,
        },
      ],
    },
    options: {
      ...baseOptions('Top clientes por facturación'),
      indexAxis: 'y',
      scales: {
        x: {
          ticks: {
            callback: (value) => formatReporteCurrency(Number(value)),
          },
        },
      },
    },
  };
}

export function buildGastosChart(reporte: ReporteAdministrativo): ChartConfiguration {
  const labels = reporte.gastos_por_tipo.map((item) => gastoTipoLabel(item.tipo));
  const data = reporte.gastos_por_tipo.map((item) => Number(item.total));

  return {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: [CHART_COLORS.rose, CHART_COLORS.amber, CHART_COLORS.slate],
          borderWidth: 2,
          borderColor: '#fff',
        },
      ],
    },
    options: baseOptions('Egresos por tipo'),
  };
}

export function buildProveedoresChart(reporte: ReporteAdministrativo): ChartConfiguration {
  const labels = reporte.compras_por_proveedor.map((item) => item.proveedor);
  const data = reporte.compras_por_proveedor.map((item) => Number(item.total));

  return {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Compras',
          data,
          backgroundColor: CHART_COLORS.amber,
          borderRadius: 4,
        },
      ],
    },
    options: {
      ...baseOptions('Compras por proveedor'),
      indexAxis: 'y',
      scales: {
        x: {
          ticks: {
            callback: (value) => formatReporteCurrency(Number(value)),
          },
        },
      },
    },
  };
}

export function buildFlujoCajaChart(reporte: ReporteAdministrativo): ChartConfiguration {
  const labels = reporte.flujo_caja.map((item) => item.concepto);
  const data = reporte.flujo_caja.map((item) => Number(item.monto));
  const colors = reporte.flujo_caja.map((item) => {
    if (item.tipo === 'INGRESO') return CHART_COLORS.primary;
    if (item.tipo === 'RESULTADO') return CHART_COLORS.navy;
    return CHART_COLORS.rose;
  });

  return {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Monto',
          data,
          backgroundColor: colors,
          borderRadius: 6,
        },
      ],
    },
    options: {
      ...baseOptions('Flujo de caja del período'),
      scales: {
        y: {
          ticks: {
            callback: (value) => formatReporteCurrency(Number(value)),
          },
        },
      },
    },
  };
}

export function buildUtilidadChart(reporte: ReporteAdministrativo): ChartConfiguration {
  const r = reporte.resumen;
  return {
    type: 'bar',
    data: {
      labels: ['Ingresos', 'Compras', 'Gastos', 'Utilidad neta'],
      datasets: [
        {
          label: 'COP',
          data: [
            Number(r.ingresos_cobrados),
            Number(r.total_compras),
            Number(r.total_gastos),
            Number(r.utilidad_neta_estimada),
          ],
          backgroundColor: [
            CHART_COLORS.primary,
            CHART_COLORS.amber,
            CHART_COLORS.rose,
            Number(r.utilidad_neta_estimada) >= 0 ? CHART_COLORS.navy : CHART_COLORS.rose,
          ],
          borderRadius: 6,
        },
      ],
    },
    options: {
      ...baseOptions('Análisis de utilidad'),
      scales: {
        y: {
          ticks: {
            callback: (value) => formatReporteCurrency(Number(value)),
          },
        },
      },
    },
  };
}
