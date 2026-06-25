import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/auth/services/auth.service';

@Component({
  selector: 'app-home-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home-dashboard.component.html',
  styleUrls: ['./home-dashboard.component.scss'],
})
export class HomeDashboardComponent {
  readonly userName: string;
  readonly userEmail: string;

  readonly shift = {
    caja: 'Caja Principal',
    efectivo: '$ 1.450.200',
    apertura: '$ 200.000',
    ventasHoy: '$ 1.250.200',
  };

  readonly ventas = [
    { factura: '#V-8821', hora: '10:45 AM', metodo: 'Efectivo', total: '$ 45.000' },
    { factura: '#V-8820', hora: '10:32 AM', metodo: 'Nequi', total: '$ 12.500' },
    { factura: '#V-8819', hora: '10:15 AM', metodo: 'Bancolombia', total: '$ 89.000' },
  ];

  constructor(private auth: AuthService) {
    this.userName = this.auth.getUserFullName();
    this.userEmail = this.auth.getCurrentUser()?.email ?? '';
  }
}
