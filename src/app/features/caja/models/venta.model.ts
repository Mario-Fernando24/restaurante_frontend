export interface MetodoPago {
  metodo_pago: string;
  nombre: string;
  requiere_referencia: boolean;
  tipo?: string;
}

export interface VentaDetallePayload {
  id_producto: number;
  cantidad: number;
}

export interface VentaPagoPayload {
  metodo_pago: string;
  monto: number;
  referencia?: string;
}

export interface CrearVentaRequest {
  id_cliente?: number;
  detalle: VentaDetallePayload[];
  pagos?: VentaPagoPayload[];
  es_cortesia?: boolean;
  observacion_cortesia?: string;
}

export interface VentaDetalleLinea {
  id_producto: number;
  producto: string;
  cantidad: string | number;
  precio_unitario: string | number;
  subtotal: string | number;
}

export interface VentaPago {
  id_pago?: number;
  metodo_pago: string;
  monto: string | number;
  referencia?: string | null;
  fecha_pago?: string;
}

export interface VentaDetalle {
  id_venta: number;
  id_arqueo?: number;
  total: string | number;
  tipo_venta?: string;
  es_cortesia?: boolean;
  observacion_cortesia?: string | null;
  estado?: string;
  fecha_creacion?: string;
  vendedor?: string;
  cliente?: string | null;
  detalle?: VentaDetalleLinea[];
  pagos?: VentaPago[];
}

export interface Venta {
  id_venta: number;
  total: number;
  estado?: string;
  fecha_creacion?: string;
  tipo_venta?: string;
  es_cortesia?: boolean;
}

export interface MetodoPagoApiResponse {
  status?: boolean;
  body?: MetodoPago[];
}

export interface VentaMutationResponse {
  status?: boolean;
  body?: VentaDetalle;
  venta?: VentaDetalle;
  mensaje?: string;
  message?: string;
}
