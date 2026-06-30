import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { ROUTES } from '../../../../core/routing/route-paths';
import { PaginatorComponent } from '../../../../shared/components/paginator/paginator.component';
import { CompraListItem } from '../models/compra.model';
import { CompraInventarioService } from '../services/compra-inventario.service';
import {
  formatCompraCurrency,
  formatCompraDate,
  folioCompra,
} from '../utils/compra-comprobante.util';

@Component({
  selector: 'app-compra-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PaginatorComponent],
  templateUrl: './compra-list.component.html',
  styleUrls: ['./compra-list.component.scss'],
})
export class CompraListComponent implements OnInit, OnDestroy {
  readonly routes = ROUTES;
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly pageSizeOptions = [5, 10, 25, 50];

  compras: CompraListItem[] = [];
  loading = false;
  errorMessage = '';
  page = 1;
  pageSize = 10;
  totalItems = 0;

  private readonly destroy$ = new Subject<void>();

  constructor(private compraService: CompraInventarioService) {}

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.page = 1;
        this.loadCompras();
      });

    this.loadCompras();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCompras(): void {
    this.loading = true;
    this.errorMessage = '';

    this.compraService
      .getCompras({
        search: this.searchControl.value,
        page: this.page,
        pageSize: this.pageSize,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.compras = result.items;
          this.totalItems = result.total;
          this.page = result.page;
          this.pageSize = result.pageSize;
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err?.message ?? 'Error al cargar compras';
          this.compras = [];
          this.totalItems = 0;
        },
      });
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadCompras();
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize = pageSize;
    this.page = 1;
    this.loadCompras();
  }

  formatCurrency(value: string | number): string {
    return formatCompraCurrency(Number(value));
  }

  formatDate(value: string): string {
    return formatCompraDate(value);
  }

  folio(idCompra: number): string {
    return folioCompra(idCompra);
  }

  detalleUrl(idCompra: number): string {
    return `${ROUTES.ADMIN_INVENTARIO_COMPRAS}/${idCompra}`;
  }
}
