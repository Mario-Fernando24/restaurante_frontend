import {
  CompraComprobante,
  CompraComprobanteLinea,
  CompraDetalleLinea,
  CompraRegistrada,
} from '../models/compra.model';

export function folioCompra(idCompra: number): string {
  return String(idCompra).padStart(6, '0');
}

export function formatCompraCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompraDate(value: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function nombreDetalleLinea(linea: CompraDetalleLinea): string {
  return linea.tipo === 'PRODUCTO_DIRECTO' ? linea.producto : linea.insumo;
}

export function tipoDetalleLinea(linea: CompraDetalleLinea): string {
  return linea.tipo === 'PRODUCTO_DIRECTO' ? 'Venta directa' : 'Insumo preparado';
}

export function compraTieneVentaDirecta(detalle: CompraDetalleLinea[]): boolean {
  return detalle.some((linea) => linea.tipo === 'PRODUCTO_DIRECTO');
}

export function formatCantidadCompra(cantidad: string | number): string {
  const valor = Number(cantidad);
  if (Number.isNaN(valor)) return String(cantidad);
  if (Number.isInteger(valor) || valor % 1 === 0) {
    return String(Math.round(valor));
  }
  return String(valor);
}

export function buildComprobanteFromCompra(compra: CompraRegistrada): CompraComprobante {
  const lineas: CompraComprobanteLinea[] = compra.detalle.map((linea, index) => {
    if (linea.tipo === 'PRODUCTO_DIRECTO') {
      return {
        numero: index + 1,
        descripcion: linea.producto,
        tipo: 'Venta directa',
        cantidad: linea.cantidad,
        unidad: 'unidad',
        costoUnitario: Number(linea.costo_unitario),
        subtotal: Number(linea.costo_total),
        precioVenta: Number(linea.precio_venta),
        utilidadTotal: Number(linea.utilidad_total),
      };
    }

    const cantidad = Number(linea.cantidad);
    const costoUnitario = Number(linea.costo_unitario);
    return {
      numero: index + 1,
      descripcion: linea.insumo,
      tipo: 'Insumo preparado',
      cantidad: linea.cantidad,
      unidad: linea.unidad_medida,
      costoUnitario,
      subtotal: cantidad * costoUnitario,
    };
  });

  return {
    folio: folioCompra(compra.id_compra),
    esBorrador: false,
    fecha: compra.fecha_compra,
    proveedor: compra.proveedor_nombre ?? 'Sin proveedor',
    observacion: compra.observacion ?? '',
    registradoPor: compra.registrado_por ?? undefined,
    lineas,
    totalCosto: Number(compra.total_costo),
    totalVentaPotencial: Number(compra.total_venta_potencial),
    utilidadPotencial: Number(compra.utilidad_potencial),
    facturaUrl: compra.factura_url ?? undefined,
  };
}
