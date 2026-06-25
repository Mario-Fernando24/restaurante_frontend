import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

type PeriodFilter = 'hoy' | 'semana' | 'mes';

interface KpiCard {
  label: string;
  value: string;
  badge: string;
  icon: string;
  alert?: boolean;
  trend?: boolean;
}

interface RecentSale {
  id: string;
  time: string;
  register: string;
  amount: string;
  status: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
})
export class AdminDashboardComponent {
  activePeriod: PeriodFilter = 'hoy';
  readonly todayLabel = this.formatTodayLabel();

  readonly periods: { id: PeriodFilter; label: string }[] = [
    { id: 'hoy', label: 'Hoy' },
    { id: 'semana', label: 'Semana' },
    { id: 'mes', label: 'Mes' },
  ];

  readonly kpis: KpiCard[] = [
    {
      label: 'Ventas del Día',
      value: '$ 3.450.200',
      badge: '+12.5%',
      icon: 'wallet',
      trend: true,
    },
    {
      label: 'Arqueos Abiertos',
      value: '3',
      badge: 'Activos',
      icon: 'register',
    },
    {
      label: 'Productos Activos',
      value: '1.240',
      badge: 'En Catálogo',
      icon: 'box',
    },
    {
      label: 'Insumos Stock Bajo',
      value: '12',
      badge: 'Alerta',
      icon: 'alert',
      alert: true,
    },
  ];

  readonly chartDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  readonly chartHeights = [42, 58, 48, 72, 65, 88, 76];

  readonly recentSales: RecentSale[] = [
    { id: '#V-29402', time: 'Hace 2 mins', register: 'Caja 01', amount: '$ 45.000', status: 'PAGADO' },
    { id: '#V-29401', time: 'Hace 15 mins', register: 'Caja 02', amount: '$ 128.500', status: 'PAGADO' },
    { id: '#V-29400', time: 'Hace 32 mins', register: 'Caja 01', amount: '$ 22.000', status: 'PAGADO' },
    { id: '#V-29399', time: 'Hace 1 hora', register: 'Caja 03', amount: '$ 89.900', status: 'PAGADO' },
    { id: '#V-29398', time: 'Hace 2 horas', register: 'Caja 01', amount: '$ 156.000', status: 'PAGADO' },
  ];

  readonly inventoryPercent = 85;

  setPeriod(period: PeriodFilter): void {
    this.activePeriod = period;
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
