export interface StockInsumoItem {
  id_insumo: number;
  nombre: string;
  unidad_medida: string;
  stock_actual: number;
  stock_minimo: number;
  stock_bajo: boolean;
}

export interface StockCategoriaGrupo {
  id_categoria: number;
  nombre: string;
  total_insumos: number;
  insumos: StockInsumoItem[];
}

export interface StockPorCategoriaReport {
  fecha_consulta: string;
  total_insumos: number;
  categorias: StockCategoriaGrupo[];
  sin_categoria: StockInsumoItem[];
}
