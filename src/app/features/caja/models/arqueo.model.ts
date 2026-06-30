export interface ArqueoResumenCierre {
  base_inicial: number;
  ventas_efectivo: number;
  ventas_tarjeta: number;
  ventas_transferencia: number;
  ventas_nequi: number;
  ventas_daviplata: number;
  ventas_otros: number;
  total_ventas: number;
  gastos_efectivo?: number;
  total_gastos?: number;
  cantidad_cortesias?: number;
  valor_cortesias?: number;
  dinero_esperado: number;
  cantidad_ventas: number;
}

export interface Arqueo {
  id_arqueo: number;
  id_usuario?: number;
  cajero?: string;
  monto_apertura: number;
  monto_cierre?: number;
  monto_cierre_real?: number;
  monto_cierre_esperado?: number;
  monto_efectivo_esperado?: number;
  diferencia?: number;
  observacion?: string;
  estado: string;
  fecha_apertura: string;
  fecha_cierre?: string;
  resumen?: ArqueoResumenCierre;
}

export interface AbrirArqueoRequest {
  monto_apertura: number;
  observacion?: string;
}

export interface CerrarArqueoRequest {
  monto_cierre_real: number;
  observacion?: string;
}

export interface ArqueoApiResponse {
  status: boolean;
  body: Arqueo[];
}

export interface ArqueoActivoResponse {
  status: boolean;
  body: Arqueo | null;
}

export interface ArqueoMutationResponse {
  status?: boolean;
  body?: Arqueo;
  mensaje?: string;
  message?: string;
}

export interface ArqueoQueryParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TurnoPagoResumen {
  metodo_pago: string;
  cantidad: number;
  total: number;
}

export interface TurnoCategoriaResumen {
  id_categoria: number;
  categoria: string;
  cantidad: number;
  total: number;
}

export interface TurnoProductoResumen {
  id_producto: number;
  producto: string;
  id_categoria: number;
  categoria: string;
  cantidad: number;
  total: number;
}

export interface TurnoVentaLinea {
  id_producto: number;
  producto: string;
  cantidad: number;
  subtotal: number;
}

export interface TurnoVentaPago {
  metodo_pago: string;
  monto: number;
  referencia?: string;
  fecha_pago?: string;
}

export interface TurnoVentaDetalle {
  id_venta: number;
  total: number;
  tipo_venta?: string;
  es_cortesia?: boolean;
  observacion_cortesia?: string;
  fecha_creacion: string;
  vendedor?: string;
  cliente?: string;
  detalle: TurnoVentaLinea[];
  pagos: TurnoVentaPago[];
}

export interface TurnoGastoDetalle {
  id_gasto: number;
  tipo: string;
  tipo_nombre: string;
  concepto: string;
  beneficiario?: string;
  monto: number;
  metodo_pago: string;
  fecha_registro: string;
}

export interface TurnoDetalle {
  arqueo: Arqueo;
  resumen: ArqueoResumenCierre;
  pagos_por_metodo: TurnoPagoResumen[];
  por_categoria: TurnoCategoriaResumen[];
  por_producto: TurnoProductoResumen[];
  ventas: TurnoVentaDetalle[];
  gastos?: TurnoGastoDetalle[];
}

export const METODO_PAGO_LABELS: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  TARJETA: 'Tarjeta',
  TRANSFERENCIA: 'Transferencia',
  NEQUI: 'Nequi',
  DAVIPLATA: 'Daviplata',
  BANCOLOMBIA: 'Bancolombia',
  NU: 'Nu',
  DALE: 'Dale',
  CORTESIA: 'Cortesía',
};
