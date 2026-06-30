import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subject, interval } from 'rxjs';
import { startWith, switchMap, takeUntil } from 'rxjs/operators';
import { ROUTES } from '../../../../core/routing/route-paths';
import { MesaSalonItem } from '../../../admin/mesas/models/mesa.model';
import { MesaService } from '../../../admin/mesas/services/mesa.service';

interface ZonaGrupo {
  zona: string;
  mesas: MesaSalonItem[];
}

@Component({
  selector: 'app-mesas-salon',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mesas-salon.component.html',
  styleUrls: ['./mesas-salon.component.scss'],
})
export class MesasSalonComponent implements OnInit, OnDestroy {
  readonly routes = ROUTES;

  mesas: MesaSalonItem[] = [];
  loading = true;
  errorMessage = '';

  private readonly destroy$ = new Subject<void>();

  constructor(
    private mesaService: MesaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    interval(15000)
      .pipe(
        startWith(0),
        switchMap(() => this.mesaService.getSalon()),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (mesas) => {
          this.mesas = mesas;
          this.loading = false;
          this.errorMessage = '';
        },
        error: (error: Error) => {
          this.errorMessage = error.message;
          this.loading = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get zonas(): ZonaGrupo[] {
    const map = new Map<string, MesaSalonItem[]>();
    for (const mesa of this.mesas) {
      const zona = mesa.zona?.trim() || 'Salón';
      const list = map.get(zona) ?? [];
      list.push(mesa);
      map.set(zona, list);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b, 'es'))
      .map(([zona, mesas]) => ({
        zona,
        mesas: mesas.sort((a, b) => a.numero.localeCompare(b.numero, 'es', { numeric: true })),
      }));
  }

  get mesasOcupadas(): number {
    return this.mesas.filter((m) => m.ocupada).length;
  }

  get mesasLibres(): number {
    return this.mesas.filter((m) => !m.ocupada).length;
  }

  abrirMesa(mesa: MesaSalonItem): void {
    this.router.navigate([ROUTES.CAJERO_MESAS, mesa.id_mesa]);
  }

  formatCurrency(value: string | number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(Number(value));
  }

  formatTime(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  }
}
