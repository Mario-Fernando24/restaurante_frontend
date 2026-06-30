import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ThermalTicket } from './thermal-ticket.model';
import { formatThermalCurrency } from './thermal-ticket.util';

@Component({
  selector: 'app-thermal-receipt',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './thermal-receipt.component.html',
  styleUrls: ['./thermal-receipt.component.scss'],
})
export class ThermalReceiptComponent {
  @Input({ required: true }) ticket!: ThermalTicket;

  formatCurrency = formatThermalCurrency;

  get itemColumnLabel(): string {
    return this.ticket.tipo === 'COMPRA' ? 'Ítem' : 'Producto';
  }

  get priceColumnLabel(): string {
    return this.ticket.tipo === 'COMPRA' ? 'Costo' : 'Precio';
  }

  get cajeroLabel(): string {
    if (this.ticket.tipo === 'COMPRA') return 'Registrado por';
    return 'Cajero';
  }

  get amountLabel(): string {
    switch (this.ticket.tipo) {
      case 'CORTESIA':
        return 'Cobrado';
      case 'COMPRA':
        return 'Total costo';
      case 'CIERRE':
        return 'Total ventas';
      default:
        return 'Total';
    }
  }
}
