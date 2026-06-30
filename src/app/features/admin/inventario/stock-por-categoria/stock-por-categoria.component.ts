import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import {
  unidadMedidaCorta,
  unidadMedidaLegible,
} from '../../insumos/utils/insumo-costo.util';
import { StockCategoriaGrupo, StockPorCategoriaReport } from '../models/stock.model';
import { InventarioStockService } from '../services/inventario-stock.service';

@Component({
  selector: 'app-stock-por-categoria',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './stock-por-categoria.component.html',
  styleUrls: ['./stock-por-categoria.component.scss'],
})
export class StockPorCategoriaComponent implements OnInit, OnDestroy {
  readonly searchControl = new FormControl('', { nonNullable: true });

  reporte: StockPorCategoriaReport | null = null;
  gruposFiltrados: StockCategoriaGrupo[] = [];
  sinCategoriaFiltrados: StockPorCategoriaReport['sin_categoria'] = [];

  loading = false;
  errorMessage = '';

  private readonly destroy$ = new Subject<void>();

  constructor(private inventarioStockService: InventarioStockService) {}

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => this.applyFilters());

    this.loadReporte();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadReporte(): void {
    this.loading = true;
    this.errorMessage = '';

    this.inventarioStockService
      .getStockPorCategoria()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reporte) => {
          this.reporte = reporte;
          this.applyFilters();
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err?.message ?? 'Error al cargar el inventario';
          this.reporte = null;
          this.gruposFiltrados = [];
          this.sinCategoriaFiltrados = [];
        },
      });
  }

  imprimir(): void {
    window.print();
  }

  formatStock(cantidad: number, unidad: string): string {
    const valor = Number.isInteger(cantidad) ? String(cantidad) : cantidad.toFixed(2);
    const unidadLabel = unidadMedidaLegible(unidad);
    return unidad.toUpperCase() === 'UNIDAD'
      ? cantidad === 1
        ? '1 unidad'
        : `${valor} unidades`
      : `${valor} ${unidadMedidaCorta(unidad)}`;
  }

  formatDate(value?: string): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('es-CO', {
      dateStyle: 'long',
      timeStyle: 'short',
    });
  }

  get totalStockBajo(): number {
    if (!this.reporte) return 0;
    const todos = [
      ...this.reporte.categorias.flatMap((grupo) => grupo.insumos),
      ...this.reporte.sin_categoria,
    ];
    return todos.filter((item) => item.stock_bajo).length;
  }

  private applyFilters(): void {
    if (!this.reporte) {
      this.gruposFiltrados = [];
      this.sinCategoriaFiltrados = [];
      return;
    }

    const term = this.searchControl.value.trim().toLowerCase();

    this.gruposFiltrados = this.reporte.categorias
      .map((grupo) => ({
        ...grupo,
        insumos: grupo.insumos.filter((insumo) => this.matchesSearch(insumo.nombre, term)),
      }))
      .filter((grupo) => grupo.insumos.length > 0 || this.matchesSearch(grupo.nombre, term));

    this.sinCategoriaFiltrados = this.reporte.sin_categoria.filter((insumo) =>
      this.matchesSearch(insumo.nombre, term)
    );
  }

  private matchesSearch(value: string, term: string): boolean {
    if (!term) return true;
    return value.toLowerCase().includes(term);
  }
}
