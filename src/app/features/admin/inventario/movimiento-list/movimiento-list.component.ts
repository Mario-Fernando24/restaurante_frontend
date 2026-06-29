import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { PaginatorComponent } from '../../../../shared/components/paginator/paginator.component';
import {
  MovimientoInventario,
  TIPOS_MOVIMIENTO,
} from '../models/movimiento.model';
import { MovimientoService } from '../services/movimiento.service';

@Component({
  selector: 'app-movimiento-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PaginatorComponent],
  templateUrl: './movimiento-list.component.html',
  styleUrls: ['./movimiento-list.component.scss'],
})
export class MovimientoListComponent implements OnInit, OnDestroy {
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly tipoControl = new FormControl('', { nonNullable: true });
  readonly pageSizeOptions = [5, 10, 25, 50];
  readonly tiposMovimiento = TIPOS_MOVIMIENTO;

  movimientos: MovimientoInventario[] = [];
  loading = false;
  errorMessage = '';

  page = 1;
  pageSize = 10;
  totalItems = 0;

  private readonly destroy$ = new Subject<void>();

  constructor(private movimientoService: MovimientoService) {}

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.page = 1;
        this.loadMovimientos();
      });

    this.tipoControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.page = 1;
      this.loadMovimientos();
    });

    this.loadMovimientos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMovimientos(): void {
    this.loading = true;
    this.errorMessage = '';

    this.movimientoService
      .getMovimientos({
        search: this.searchControl.value,
        tipo: this.tipoControl.value,
        page: this.page,
        pageSize: this.pageSize,
      })
      .subscribe({
        next: (result) => {
          this.movimientos = result.items;
          this.totalItems = result.total;
          this.page = result.page;
          this.pageSize = result.pageSize;
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err?.message ?? 'Error al cargar los movimientos';
          this.movimientos = [];
          this.totalItems = 0;
        },
      });
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadMovimientos();
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize = pageSize;
    this.page = 1;
    this.loadMovimientos();
  }

  getTipoBadgeClass(tipo: string): string {
    switch (tipo.toUpperCase()) {
      case 'ENTRADA':
        return 'status-badge--active';
      case 'SALIDA':
        return 'status-badge--inactive';
      default:
        return 'status-badge--warning';
    }
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
}
