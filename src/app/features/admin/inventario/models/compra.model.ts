export interface CompraLineaInsumoRequest {
  id_insumo: number;
  cantidad: number;
  costo_unitario?: number;
}

export interface CompraLineaProductoRequest {
  id_producto: number;
  cantidad: number;
  costo_unitario: number;
}

export interface RegistrarCompraRequest {
  id_proveedor?: number;
  observacion?: string;
  factura_base64?: string;
  lineas?: CompraLineaInsumoRequest[];
  lineas_insumo?: CompraLineaInsumoRequest[];
  lineas_productos?: CompraLineaProductoRequest[];
}

export interface CompraMovimiento {
  id_movimiento: number;
  id_insumo: number;
  insumo_nombre?: string;
  cantidad: number;
  motivo: string;
}

export interface CompraDetalleProductoDirecto {
  tipo: 'PRODUCTO_DIRECTO';
  id_producto: number;
  producto: string;
  id_insumo: number;
  cantidad: string;
  costo_unitario: string;
  precio_venta: string;
  utilidad_unitaria: string;
  costo_total: string;
  venta_potencial: string;
  utilidad_total: string;
}

export interface CompraDetalleInsumo {
  tipo: 'INSUMO';
  id_insumo: number;
  insumo: string;
  cantidad: string;
  unidad_medida: string;
  costo_unitario: string;
}

export type CompraDetalleLinea = CompraDetalleProductoDirecto | CompraDetalleInsumo;

export interface CompraResumen {
  total_costo: string;
  total_venta_potencial: string;
  utilidad_potencial: string;
}

export interface CompraRegistrada {
  id_compra: number;
  id_proveedor?: number | null;
  proveedor_nombre?: string | null;
  observacion?: string;
  factura_url?: string | null;
  detalle: CompraDetalleLinea[];
  total_costo: string;
  total_venta_potencial: string;
  utilidad_potencial: string;
  registrado_por?: string | null;
  fecha_compra: string;
}

export interface CompraListItem {
  id_compra: number;
  id_proveedor?: number | null;
  proveedor_nombre?: string | null;
  observacion?: string;
  factura_url?: string | null;
  total_costo: string;
  total_venta_potencial: string;
  utilidad_potencial: string;
  registrado_por?: string | null;
  fecha_compra: string;
  total_lineas: number;
  tiene_factura: boolean;
}

export interface CompraQueryParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CompraDetalleResponse {
  compra: CompraRegistrada;
  movimientos: CompraMovimientoDetalle[];
}

export interface CompraMovimientoDetalle {
  id_movimiento: number;
  id_insumo: number;
  insumo_nombre?: string;
  id_producto?: number | null;
  producto_nombre?: string | null;
  tipo_movimiento: string;
  cantidad: string;
  motivo: string;
  usuario?: string | null;
  fecha_movimiento: string;
}

export interface PaginatedCompras {
  items: CompraListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RegistrarCompraResponse {
  compra: CompraRegistrada;
  movimientos: CompraMovimiento[];
  detalle: CompraDetalleLinea[];
  resumen: CompraResumen;
}

export interface CompraComprobanteLinea {
  numero: number;
  descripcion: string;
  tipo: 'Venta directa' | 'Insumo preparado';
  cantidad: string;
  unidad?: string;
  costoUnitario: number;
  subtotal: number;
  precioVenta?: number;
  utilidadTotal?: number;
}

export interface CompraComprobante {
  folio: string;
  esBorrador: boolean;
  fecha: string;
  proveedor: string;
  observacion: string;
  registradoPor?: string;
  lineas: CompraComprobanteLinea[];
  totalCosto: number;
  totalVentaPotencial: number;
  utilidadPotencial: number;
  facturaUrl?: string;
}
