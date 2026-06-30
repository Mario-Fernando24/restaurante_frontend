import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { forkJoin, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { PaginatorComponent } from '../../../../shared/components/paginator/paginator.component';
import { Insumo } from '../../insumos/models/insumo.model';
import { InsumoService } from '../../insumos/services/insumo.service';
import {
  MovimientoGrupo,
  MovimientoInventario,
  MovimientoLinea,
  MovimientoProductoGrupo,
  TIPOS_MOVIMIENTO,
} from '../models/movimiento.model';
import { MovimientoService } from '../services/movimiento.service';
import { Receta } from '../../recetas/models/receta.model';
import { RecetaService } from '../../recetas/services/receta.service';
import { ProductoService } from '../../productos/services/producto.service';

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

  grupos: MovimientoGrupo[] = [];
  loading = false;
  errorMessage = '';

  page = 1;
  pageSize = 10;
  totalItems = 0;

  private allGrupos: MovimientoGrupo[] = [];
  private insumosById = new Map<number, Insumo>();
  private productosById = new Map<number, string>();
  private recetasByProducto = new Map<number, Receta[]>();
  private readonly destroy$ = new Subject<void>();

  constructor(
    private movimientoService: MovimientoService,
    private insumoService: InsumoService,
    private recetaService: RecetaService,
    private productoService: ProductoService
  ) {}

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.page = 1;
        this.applyFiltersAndPagination();
      });

    this.tipoControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.page = 1;
      this.applyFiltersAndPagination();
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

    forkJoin({
      movimientos: this.movimientoService.getMovimientos({ pageSize: 10000 }),
      insumos: this.insumoService.getInsumos({ pageSize: 1000 }),
      recetas: this.recetaService.getRecetas({ pageSize: 10000 }),
      productos: this.productoService.getProductos({ pageSize: 1000 }),
    }).subscribe({
      next: ({ movimientos, insumos, recetas, productos }) => {
        this.insumosById = new Map(insumos.items.map((i) => [i.id_insumo, i]));
        this.productosById = new Map(productos.items.map((p) => [p.id_producto, p.nombre]));
        this.recetasByProducto = this.groupRecetasByProducto(recetas.items);
        this.allGrupos = this.buildGrupos(movimientos.items);
        this.applyFiltersAndPagination();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.message ?? 'Error al cargar los movimientos';
        this.allGrupos = [];
        this.grupos = [];
        this.totalItems = 0;
      },
    });
  }

  onPageChange(page: number): void {
    this.page = page;
    this.applyFiltersAndPagination();
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize = pageSize;
    this.page = 1;
    this.applyFiltersAndPagination();
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

  getTipoLabel(tipo: string): string {
    switch (tipo.toUpperCase()) {
      case 'ENTRADA':
        return 'Entrada';
      case 'SALIDA':
        return 'Salida';
      case 'AJUSTE':
        return 'Ajuste';
      default:
        return tipo;
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

  private applyFiltersAndPagination(): void {
    const term = this.searchControl.value.trim().toLowerCase();
    const tipo = this.tipoControl.value.trim().toUpperCase();

    let filtered = this.allGrupos;

    if (tipo) {
      filtered = filtered.filter((g) => g.tipo_movimiento.toUpperCase() === tipo);
    }

    if (term) {
      filtered = filtered.filter(
        (g) =>
          g.titulo.toLowerCase().includes(term) ||
          g.subtitulo.toLowerCase().includes(term) ||
          (g.nombre_usuario ?? '').toLowerCase().includes(term) ||
          g.lineas.some((l) => l.nombreInsumo.toLowerCase().includes(term)) ||
          g.productos.some(
            (p) =>
              p.nombreProducto.toLowerCase().includes(term) ||
              p.lineas.some((l) => l.nombreInsumo.toLowerCase().includes(term))
          )
      );
    }

    this.totalItems = filtered.length;
    const start = (this.page - 1) * this.pageSize;
    this.grupos = filtered.slice(start, start + this.pageSize);
  }

  private buildGrupos(movimientos: MovimientoInventario[]): MovimientoGrupo[] {
    const map = new Map<string, { grupo: MovimientoGrupo; raw: MovimientoInventario[] }>();

    const sorted = [...movimientos].sort(
      (a, b) =>
        new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime()
    );

    for (const movimiento of sorted) {
      const ventaMatch = movimiento.motivo.match(/^Venta #(\d+)$/i);
      const esVenta = !!ventaMatch;
      const groupId = esVenta ? `venta-${ventaMatch![1]}` : `mov-${movimiento.id_movimiento}`;

      const existing = map.get(groupId);
      if (existing) {
        existing.raw.push(movimiento);
        if (
          new Date(movimiento.fecha_creacion).getTime() >
          new Date(existing.grupo.fecha).getTime()
        ) {
          existing.grupo.fecha = movimiento.fecha_creacion;
        }
        if (!existing.grupo.nombre_usuario && movimiento.nombre_usuario) {
          existing.grupo.nombre_usuario = movimiento.nombre_usuario;
        }
      } else {
        map.set(groupId, {
          raw: [movimiento],
          grupo: {
            id: groupId,
            titulo: esVenta ? `Venta #${ventaMatch![1]}` : movimiento.motivo,
            subtitulo: esVenta
              ? 'Productos vendidos e insumos descontados'
              : this.getTipoLabel(movimiento.tipo_movimiento),
            tipo_movimiento: movimiento.tipo_movimiento,
            esVenta,
            nombre_usuario: movimiento.nombre_usuario,
            fecha: movimiento.fecha_creacion,
            productos: [],
            lineas: [],
          },
        });
      }
    }

    return Array.from(map.values())
      .map(({ grupo, raw }) => {
        if (grupo.esVenta) {
          return {
            ...grupo,
            productos: this.buildProductoGrupos(raw),
            lineas: [],
          };
        }

        return {
          ...grupo,
          productos: [],
          lineas: raw
            .map((movimiento) => this.toLinea(movimiento))
            .sort((a, b) => a.nombreInsumo.localeCompare(b.nombreInsumo)),
        };
      })
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }

  private buildProductoGrupos(movimientos: MovimientoInventario[]): MovimientoProductoGrupo[] {
    const byProducto = new Map<number, MovimientoLinea[]>();
    const sinProducto: MovimientoInventario[] = [];

    for (const movimiento of movimientos) {
      if (movimiento.id_producto) {
        const lineas = byProducto.get(movimiento.id_producto) ?? [];
        lineas.push(this.toLinea(movimiento));
        byProducto.set(movimiento.id_producto, lineas);
      } else {
        sinProducto.push(movimiento);
      }
    }

    const inferred = this.inferProductosFromRecetas(sinProducto);
    for (const [productoId, lineas] of inferred) {
      const existing = byProducto.get(productoId) ?? [];
      byProducto.set(productoId, [...existing, ...lineas]);
    }

    const grupos: MovimientoProductoGrupo[] = Array.from(byProducto.entries()).map(
      ([productoId, lineas]) => ({
        nombreProducto:
          movimientos.find((m) => m.id_producto === productoId)?.nombre_producto ??
          this.productosById.get(productoId) ??
          `Producto #${productoId}`,
        lineas: lineas.sort((a, b) => a.nombreInsumo.localeCompare(b.nombreInsumo)),
      })
    );

    const restantes = inferred.get(-1) ?? [];
    if (restantes.length) {
      grupos.push({
        nombreProducto: 'Producto no identificado',
        lineas: restantes.sort((a, b) => a.nombreInsumo.localeCompare(b.nombreInsumo)),
      });
    }

    return grupos.sort((a, b) => a.nombreProducto.localeCompare(b.nombreProducto));
  }

  private inferProductosFromRecetas(
    movimientos: MovimientoInventario[]
  ): Map<number, MovimientoLinea[]> {
    const result = new Map<number, MovimientoLinea[]>();
    if (!movimientos.length || !this.recetasByProducto.size) {
      if (movimientos.length) {
        result.set(
          -1,
          movimientos.map((m) => this.toLinea(m))
        );
      }
      return result;
    }

    const pool = movimientos.map((movimiento) => ({
      movimiento,
      linea: this.toLinea(movimiento),
      usado: false,
    }));

    for (const [productoId, recetas] of this.recetasByProducto) {
      if (!recetas.length) continue;

      let matched = true;
      const matchedItems: typeof pool = [];

      while (matched) {
        matched = false;
        const batch: typeof pool = [];

        for (const receta of recetas) {
          const item = pool.find(
            (entry) =>
              !entry.usado &&
              entry.movimiento.id_insumo === receta.id_insumo &&
              entry.movimiento.cantidad === receta.cantidad_usada
          );
          if (!item) break;
          batch.push(item);
        }

        if (batch.length === recetas.length) {
          batch.forEach((entry) => {
            entry.usado = true;
            matchedItems.push(entry);
          });
          matched = true;
        }
      }

      if (matchedItems.length) {
        const lineas = result.get(productoId) ?? [];
        result.set(
          productoId,
          [...lineas, ...matchedItems.map((entry) => entry.linea)]
        );
      }
    }

    const restantes = pool.filter((entry) => !entry.usado).map((entry) => entry.linea);
    if (restantes.length) {
      result.set(-1, restantes);
    }

    return result;
  }

  private toLinea(movimiento: MovimientoInventario): MovimientoLinea {
    const insumo = this.insumosById.get(movimiento.id_insumo);
    const nombreInsumo =
      movimiento.nombre_insumo ??
      insumo?.nombre ??
      `Insumo #${movimiento.id_insumo}`;
    const unidad = String(insumo?.unidad_medida ?? '');

    return {
      id_movimiento: movimiento.id_movimiento,
      nombreInsumo,
      cantidad: movimiento.cantidad,
      cantidadLabel: this.formatCantidad(movimiento.cantidad, unidad),
    };
  }

  private groupRecetasByProducto(recetas: Receta[]): Map<number, Receta[]> {
    const map = new Map<number, Receta[]>();
    for (const receta of recetas) {
      const list = map.get(receta.id_producto) ?? [];
      list.push(receta);
      map.set(receta.id_producto, list);
    }
    return map;
  }

  private formatCantidad(cantidad: number, unidad: string): string {
    switch (unidad.toUpperCase()) {
      case 'GRAMO':
        return `${cantidad} g`;
      case 'UNIDAD':
        return cantidad === 1 ? '1 unidad' : `${cantidad} unidades`;
      case 'MILILITRO':
        return `${cantidad} ml`;
      case 'LITRO':
        return cantidad === 1 ? '1 litro' : `${cantidad} litros`;
      default:
        return unidad ? `${cantidad} ${unidad.toLowerCase()}` : String(cantidad);
    }
  }
}
