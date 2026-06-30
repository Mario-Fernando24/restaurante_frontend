export interface ReporteFiltros {
  fecha_desde: string;
  fecha_hasta: string;
  id_cliente: number | null;
  id_arqueo: number | null;
  id_proveedor: number | null;
}

export interface ReporteResumen {
  ingresos_cobrados: string;
  total_ventas_referencia: string;
  cantidad_ventas: number;
  ticket_promedio: string;
  cantidad_cortesias: number;
  valor_cortesias: string;
  total_gastos: string;
  gastos_nomina: string;
  gastos_administrativos: string;
  gastos_otros: string;
  total_compras: string;
  utilidad_potencial_compras: string;
  venta_potencial_compras: string;
  utilidad_neta_estimada: string;
  margen_porcentaje: string;
}

export interface ReporteSerieDia {
  fecha: string | null;
  total: string;
  cantidad: number;
}

export interface ReporteSerieHora {
  hora: number;
  total: string;
  cantidad: number;
}

export interface ReporteSerieMetodo {
  metodo_pago: string;
  total: string;
  cantidad: number;
}

export interface ReporteSerieCategoria {
  id_categoria: number;
  categoria: string;
  total: string;
  cantidad: string;
}

export interface ReporteSerieProducto {
  id_producto: number;
  producto: string;
  categoria: string;
  total: string;
  cantidad: string;
}

export interface ReporteSerieCliente {
  id_cliente: number;
  cliente: string;
  total: string;
  cantidad: number;
}

export interface ReporteSerieGasto {
  tipo: string;
  total: string;
  cantidad: number;
}

export interface ReporteSerieProveedor {
  id_proveedor: number | null;
  proveedor: string;
  total: string;
  cantidad: number;
}

export interface ReporteArqueoItem {
  id_arqueo: number;
  cajero: string;
  estado: string;
  fecha_apertura: string;
  fecha_cierre: string | null;
  total_ventas: string;
  total_gastos: string;
  diferencia: string;
  cantidad_ventas: number;
}

export interface ReporteFlujoItem {
  concepto: string;
  monto: string;
  tipo: 'INGRESO' | 'EGRESO' | 'RESULTADO';
}

export interface ReporteAdministrativo {
  filtros: ReporteFiltros;
  resumen: ReporteResumen;
  ventas_por_dia: ReporteSerieDia[];
  ventas_por_hora: ReporteSerieHora[];
  ventas_por_metodo_pago: ReporteSerieMetodo[];
  ventas_por_categoria: ReporteSerieCategoria[];
  ventas_por_producto: ReporteSerieProducto[];
  top_clientes: ReporteSerieCliente[];
  gastos_por_tipo: ReporteSerieGasto[];
  compras_por_proveedor: ReporteSerieProveedor[];
  arqueos_resumen: ReporteArqueoItem[];
  flujo_caja: ReporteFlujoItem[];
  generado_en: string;
}

export interface ReporteQueryParams {
  fecha_desde?: string;
  fecha_hasta?: string;
  id_cliente?: number;
  id_arqueo?: number;
  id_proveedor?: number;
}
