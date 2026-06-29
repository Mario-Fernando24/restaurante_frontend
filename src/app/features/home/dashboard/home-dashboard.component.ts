import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../core/auth/services/auth.service';
import { ROUTES } from '../../../core/routing/route-paths';
import { Arqueo } from '../../caja/models/arqueo.model';
import { ArqueoService } from '../../caja/services/arqueo.service';

@Component({
  selector: 'app-home-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home-dashboard.component.html',
  styleUrls: ['./home-dashboard.component.scss'],
})
export class HomeDashboardComponent implements OnInit, OnDestroy {
  readonly routes = ROUTES;
  readonly userName: string;
  readonly userEmail: string;

  arqueo: Arqueo | null = null;
  loading = true;
  errorMessage = '';

  private readonly destroy$ = new Subject<void>();

  constructor(
    private auth: AuthService,
    private arqueoService: ArqueoService
  ) {
    this.userName = this.auth.getUserFullName();
    this.userEmail = this.auth.getCurrentUser()?.email ?? '';
  }

  ngOnInit(): void {
    this.loadArqueo();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isAbierto(): boolean {
    return this.arqueoService.isAbierto(this.arqueo);
  }

  loadArqueo(): void {
    this.loading = true;
    this.errorMessage = '';

    this.arqueoService
      .getArqueoActivo()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (arqueo) => {
          this.arqueo = arqueo;
          this.loading = false;
        },
        error: (error: Error) => {
          this.errorMessage = error.message;
          this.loading = false;
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

  formatDate(value: string): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }
}
