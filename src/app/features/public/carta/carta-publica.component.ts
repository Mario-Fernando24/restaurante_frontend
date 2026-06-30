import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CartaCategoria, CartaPedidoItem, CartaProducto, CartaPublica } from './models/carta.model';
import { CartaPublicaService } from './services/carta-publica.service';

@Component({
  selector: 'app-carta-publica',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './carta-publica.component.html',
  styleUrls: ['./carta-publica.component.scss'],
})
export class CartaPublicaComponent implements OnInit, OnDestroy {
  carta: CartaPublica | null = null;
  loading = true;
  errorMessage = '';
  activeCategoryId: number | null = null;
  pedido: CartaPedidoItem[] = [];
  numeroMesa = '';
  pedidoAbierto = false;
  notaPedido = '';

  private readonly destroy$ = new Subject<void>();
  private observer?: IntersectionObserver;

  constructor(
    private cartaService: CartaPublicaService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const mesaParam = this.route.snapshot.queryParamMap.get('mesa');
    if (mesaParam?.trim()) {
      this.numeroMesa = mesaParam.trim();
    }

    this.cartaService
      .getCarta()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (carta) => {
          this.carta = carta;
          this.activeCategoryId = carta.categorias[0]?.id_categoria ?? null;
          this.loading = false;
          const nombre = carta.empresa.nombre_comercial || carta.empresa.razon_social;
          if (typeof document !== 'undefined' && nombre) {
            document.title = `${nombre} · Carta`;
          }
          setTimeout(() => this.setupCategoryObserver(), 0);
        },
        error: (error: Error) => {
          this.errorMessage = error.message;
          this.loading = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.destroy$.next();
    this.destroy$.complete();
  }

  get empresa() {
    return this.carta?.empresa;
  }

  get categorias(): CartaCategoria[] {
    return this.carta?.categorias ?? [];
  }

  get pedidoItemsCount(): number {
    return this.pedido.reduce((sum, item) => sum + item.cantidad, 0);
  }

  get pedidoSubtotal(): number {
    return this.pedido.reduce((sum, item) => sum + item.precio_venta * item.cantidad, 0);
  }

  get puedeEnviarPedido(): boolean {
    return this.pedido.length > 0 && Boolean(this.whatsappPhone());
  }

  formatPrice(value: string | number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(Number(value));
  }

  imagenUrl(imagen?: string | null): string | null {
    return this.cartaService.resolveImagenUrl(imagen);
  }

  cantidadEnPedido(idProducto: number): number {
    return this.pedido.find((item) => item.id_producto === idProducto)?.cantidad ?? 0;
  }

  agregarProducto(producto: CartaProducto): void {
    const existente = this.pedido.find((item) => item.id_producto === producto.id_producto);
    if (existente) {
      existente.cantidad += 1;
    } else {
      this.pedido = [
        ...this.pedido,
        {
          id_producto: producto.id_producto,
          nombre: producto.nombre,
          precio_venta: Number(producto.precio_venta),
          cantidad: 1,
        },
      ];
    }
    this.pedidoAbierto = true;
  }

  incrementarItem(index: number): void {
    this.pedido[index].cantidad += 1;
    this.pedido = [...this.pedido];
  }

  decrementarItem(index: number): void {
    if (this.pedido[index].cantidad <= 1) {
      this.quitarItem(index);
      return;
    }
    this.pedido[index].cantidad -= 1;
    this.pedido = [...this.pedido];
  }

  quitarItem(index: number): void {
    this.pedido = this.pedido.filter((_, i) => i !== index);
    if (this.pedido.length === 0) {
      this.pedidoAbierto = false;
    }
  }

  limpiarPedido(): void {
    this.pedido = [];
    this.notaPedido = '';
    this.pedidoAbierto = false;
  }

  togglePedido(): void {
    if (this.pedido.length === 0) return;
    this.pedidoAbierto = !this.pedidoAbierto;
  }

  scrollToCategory(id: number): void {
    const el = document.getElementById(`categoria-${id}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    this.activeCategoryId = id;
  }

  whatsappPedidoLink(): string | null {
    const phone = this.whatsappPhone();
    if (!phone || this.pedido.length === 0) return null;
    return `https://wa.me/${phone}?text=${encodeURIComponent(this.buildPedidoMensaje())}`;
  }

  whatsappContactoLink(): string | null {
    const phone = this.whatsappPhone();
    if (!phone) return null;
    const msg = encodeURIComponent(
      `Hola, vi la carta de ${this.empresa?.nombre_comercial || 'su restaurante'} y tengo una consulta.`
    );
    return `https://wa.me/${phone}?text=${msg}`;
  }

  mapsLink(): string | null {
    const parts = [this.empresa?.direccion, this.empresa?.ciudad].filter(Boolean);
    if (!parts.length) return null;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(', '))}`;
  }

  private whatsappPhone(): string | null {
    const raw = this.empresa?.telefono?.replace(/\D/g, '') ?? '';
    if (!raw) return null;
    if (raw.startsWith('57') && raw.length >= 12) return raw;
    if (raw.length === 10) return `57${raw}`;
    return raw;
  }

  private buildPedidoMensaje(): string {
    const restaurante = this.empresa?.nombre_comercial || 'el restaurante';
    const mesa = this.numeroMesa.trim();
    const lineas = this.pedido.map(
      (item) => `• ${item.cantidad}× ${item.nombre}`
    );

    const partes = [
      mesa
        ? `Hola, estoy en *Mesa ${mesa}* y quiero pedir en ${restaurante}:`
        : `Hola, quiero pedir en ${restaurante}:`,
      '',
      ...lineas,
      '',
      `*Total referencial:* ${this.formatPrice(this.pedidoSubtotal)}`,
    ];

    const nota = this.notaPedido.trim();
    if (nota) {
      partes.push('', `Nota: ${nota}`);
    }

    partes.push('', '_Pedido enviado desde la carta digital_');
    return partes.join('\n');
  }

  private setupCategoryObserver(): void {
    if (typeof IntersectionObserver === 'undefined') return;

    const sections = document.querySelectorAll('[data-categoria-id]');
    if (!sections.length) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const id = Number(visible.target.getAttribute('data-categoria-id'));
          if (!Number.isNaN(id)) this.activeCategoryId = id;
        }
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: [0, 0.25, 0.5, 1] }
    );

    sections.forEach((section) => this.observer!.observe(section));
  }
}
