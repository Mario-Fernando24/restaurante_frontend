import { Empresa } from '../../core/models/empresa.model';
import { CompraComprobante } from '../../features/admin/inventario/models/compra.model';
import { TurnoDetalle } from '../../features/caja/models/arqueo.model';
import { Gasto } from '../../features/caja/models/gasto.model';
import { VentaDetalle } from '../../features/caja/models/venta.model';
import { METODO_PAGO_LABELS } from '../../features/caja/models/arqueo.model';
import { ThermalTicket, ThermalTicketLinea } from './thermal-ticket.model';

export function formatThermalCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatThermalDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function folioTicket(numero: number | string, pad = 6): string {
  return String(numero).padStart(pad, '0');
}

export function printThermalTicket(delayMs = 200): void {
  setTimeout(() => window.print(), delayMs);
}

export function metodoPagoLabel(code: string): string {
  return METODO_PAGO_LABELS[code] ?? code.replace(/_/g, ' ');
}

export function buildVentaTicket(venta: VentaDetalle, empresa: Empresa): ThermalTicket {
  const esCortesia = venta.es_cortesia || venta.tipo_venta === 'CORTESIA';
  const lineas: ThermalTicketLinea[] = (venta.detalle ?? []).map((item) => ({
    producto: item.producto,
    cantidad: item.cantidad,
    precio: Number(item.precio_unitario),
    total: Number(item.subtotal),
  }));
  const totalQty = lineas.reduce((sum, linea) => sum + Number(linea.cantidad), 0);
  const totalReferencia = Number(venta.total);
  const totalCobrado = esCortesia
    ? 0
    : (venta.pagos ?? []).reduce((sum, pago) => sum + Number(pago.monto), 0);

  return {
    tipo: esCortesia ? 'CORTESIA' : 'VENTA',
    titulo: esCortesia ? 'COMPROBANTE DE CORTESÍA' : 'FACTURA DE VENTA',
    subtitulo: esCortesia ? 'La casa invita' : undefined,
    numero: folioTicket(venta.id_venta),
    fecha: formatThermalDate(venta.fecha_creacion ?? new Date().toISOString()),
    empresa,
    cajero: venta.vendedor,
    cliente: venta.cliente ?? undefined,
    lineas,
    totalQty,
    totalReferencia,
    totalCobrado,
    observacion: venta.observacion_cortesia ?? undefined,
    metodoPago: esCortesia
      ? 'Cortesía'
      : (venta.pagos ?? []).map((p) => metodoPagoLabel(p.metodo_pago)).join(' · '),
    pieExtra: esCortesia ? 'Documento de control interno — sin cobro al cliente' : undefined,
  };
}

export function buildGastoTicket(gasto: Gasto, empresa: Empresa): ThermalTicket {
  const esNomina = gasto.tipo === 'NOMINA';
  return {
    tipo: esNomina ? 'NOMINA' : 'GASTO',
    titulo: esNomina ? 'RECIBO DE NÓMINA / PAGO' : 'COMPROBANTE DE EGRESO',
    subtitulo: gasto.tipo_nombre,
    numero: folioTicket(gasto.id_gasto),
    fecha: formatThermalDate(gasto.fecha_registro),
    empresa,
    cajero: gasto.registrado_por,
    beneficiario: gasto.beneficiario ?? undefined,
    lineas: [
      {
        producto: gasto.concepto,
        cantidad: 1,
        precio: Number(gasto.monto),
        total: Number(gasto.monto),
      },
    ],
    totalCobrado: Number(gasto.monto),
    observacion: gasto.observacion ?? undefined,
    metodoPago: metodoPagoLabel(gasto.metodo_pago),
    metas: gasto.referencia
      ? [{ label: 'Referencia', value: gasto.referencia }]
      : undefined,
    pieExtra: 'Comprobante de salida de caja — conservar para arqueo',
  };
}

export function buildCierreTicket(detalle: TurnoDetalle, empresa: Empresa): ThermalTicket {
  const resumen = detalle.resumen;
  const lineas: ThermalTicketLinea[] = detalle.por_producto.slice(0, 12).map((item) => ({
    producto: item.producto,
    cantidad: item.cantidad,
    precio: Number(item.total) / Math.max(Number(item.cantidad), 1),
    total: Number(item.total),
  }));

  return {
    tipo: 'CIERRE',
    titulo: 'CIERRE DE CAJA / ARQUEO',
    numero: folioTicket(detalle.arqueo.id_arqueo),
    fecha: formatThermalDate(detalle.arqueo.fecha_cierre ?? new Date().toISOString()),
    empresa,
    cajero: detalle.arqueo.cajero,
    lineas,
    totalCobrado: Number(resumen.total_ventas ?? 0),
    totalReferencia: Number(resumen.dinero_esperado ?? 0),
    metas: [
      { label: 'Base inicial', value: formatThermalCurrency(Number(resumen.base_inicial)) },
      { label: 'Ventas efectivo', value: formatThermalCurrency(Number(resumen.ventas_efectivo)) },
      { label: 'Gastos efectivo', value: formatThermalCurrency(Number(resumen.gastos_efectivo ?? 0)) },
      { label: 'Efectivo esperado', value: formatThermalCurrency(Number(resumen.dinero_esperado)) },
      { label: 'Efectivo contado', value: formatThermalCurrency(Number(detalle.arqueo.monto_cierre_real ?? 0)) },
      {
        label: 'Diferencia',
        value: formatThermalCurrency(Number(detalle.arqueo.diferencia ?? 0)),
      },
      { label: 'Ventas del turno', value: String(resumen.cantidad_ventas ?? 0) },
      { label: 'Cortesías', value: String(resumen.cantidad_cortesias ?? 0) },
    ],
    pieExtra: 'Documento de cierre — adjuntar al arqueo físico',
  };
}

export function buildCompraTicket(
  comprobante: CompraComprobante,
  empresa: Empresa
): ThermalTicket {
  const lineas: ThermalTicketLinea[] = comprobante.lineas.map((linea) => ({
    producto: linea.tipo === 'Venta directa' ? linea.descripcion : `${linea.descripcion} (insumo)`,
    cantidad: linea.cantidad,
    precio: linea.costoUnitario,
    total: linea.subtotal,
  }));

  const metas: ThermalTicket['metas'] = [];
  if (comprobante.totalVentaPotencial > 0) {
    metas.push({
      label: 'Venta potencial',
      value: formatThermalCurrency(comprobante.totalVentaPotencial),
    });
  }
  if (comprobante.utilidadPotencial !== 0) {
    metas.push({
      label: 'Utilidad potencial',
      value: formatThermalCurrency(comprobante.utilidadPotencial),
    });
  }
  if (comprobante.facturaUrl) {
    metas.push({ label: 'Factura proveedor', value: 'Adjunta en sistema' });
  }

  return {
    tipo: 'COMPRA',
    titulo: comprobante.esBorrador ? 'BORRADOR DE COMPRA' : 'COMPROBANTE DE COMPRA',
    subtitulo: 'Ingreso a inventario',
    numero: comprobante.esBorrador ? 'BORRADOR' : comprobante.folio,
    fecha: formatThermalDate(comprobante.fecha),
    empresa,
    proveedor: comprobante.proveedor,
    cajero: comprobante.registradoPor,
    lineas,
    totalQty: lineas.reduce((sum, linea) => sum + Number(linea.cantidad), 0),
    totalCobrado: comprobante.totalCosto,
    observacion: comprobante.observacion?.trim() || undefined,
    metas: metas.length ? metas : undefined,
    pieExtra: comprobante.esBorrador
      ? 'Borrador — no válido hasta registrar la compra'
      : 'Comprobante de compra — conservar para contabilidad y arqueo',
  };
}
