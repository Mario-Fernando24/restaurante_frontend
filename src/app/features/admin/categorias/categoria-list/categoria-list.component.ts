import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { PaginatorComponent } from '../../../../shared/components/paginator/paginator.component';
import { Categoria } from '../models/categoria.model';
import { CategoriaService } from '../services/categoria.service';

@Component({
  selector: 'app-categoria-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PaginatorComponent],
  templateUrl: './categoria-list.component.html',
  styleUrls: ['./categoria-list.component.scss'],
})
export class CategoriaListComponent implements OnInit, OnDestroy {
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly pageSizeOptions = [5, 10, 25, 50];

  categorias: Categoria[] = [];
  loading = false;
  errorMessage = '';

  page = 1;
  pageSize = 10;
  totalItems = 0;

  private readonly destroy$ = new Subject<void>();

  constructor(private categoriaService: CategoriaService) {}

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.page = 1;
        this.loadCategorias();
      });

    this.loadCategorias();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCategorias(): void {
    this.loading = true;
    this.errorMessage = '';

    this.categoriaService
      .getCategorias({
        search: this.searchControl.value,
        page: this.page,
        pageSize: this.pageSize,
      })
      .subscribe({
        next: (result) => {
          this.categorias = result.items;
          this.totalItems = result.total;
          this.page = result.page;
          this.pageSize = result.pageSize;
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err?.message ?? 'Error al cargar las categorías';
          this.categorias = [];
          this.totalItems = 0;
        },
      });
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadCategorias();
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize = pageSize;
    this.page = 1;
    this.loadCategorias();
  }

  isActivo(estado: string): boolean {
    return estado.toLowerCase() === 'activo';
  }

  formatDate(value: string): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}
