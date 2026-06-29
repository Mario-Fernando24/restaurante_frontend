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
  pagos: VentaPagoPayload[];
}

export interface Venta {
  id_venta: number;
  total: number;
  estado?: string;
  fecha_creacion?: string;
}

export interface MetodoPagoApiResponse {
  status?: boolean;
  body?: MetodoPago[];
}

export interface VentaMutationResponse {
  status?: boolean;
  body?: Venta;
  venta?: Venta;
  mensaje?: string;
  message?: string;
}
