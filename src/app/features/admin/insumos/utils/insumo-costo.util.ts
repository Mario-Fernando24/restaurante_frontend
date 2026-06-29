/** En Colombia, 1 libra ≈ 500 g (convención comercial). */
export const GRAMOS_POR_LIBRA_DEFAULT = 500;

export function calcularCostoPorGramoDesdeLibra(
  precioPorLibra: number,
  gramosPorLibra: number
): number {
  if (gramosPorLibra <= 0 || precioPorLibra < 0) return 0;
  return precioPorLibra / gramosPorLibra;
}

export function calcularCostoPorUnidadMedida(
  costoCompraTotal: number,
  cantidadCompra: number
): number {
  if (cantidadCompra <= 0 || costoCompraTotal < 0) return 0;
  return costoCompraTotal / cantidadCompra;
}

export function unidadMedidaCorta(unidad: string): string {
  switch (unidad.toUpperCase()) {
    case 'GRAMO':
      return 'g';
    case 'UNIDAD':
      return 'ud';
    case 'MILILITRO':
      return 'ml';
    case 'LITRO':
      return 'L';
    default:
      return unidad.toLowerCase() || 'ud';
  }
}

export function unidadMedidaLegible(unidad: string): string {
  switch (unidad.toUpperCase()) {
    case 'GRAMO':
      return 'gramo';
    case 'UNIDAD':
      return 'unidad';
    case 'MILILITRO':
      return 'mililitro';
    case 'LITRO':
      return 'litro';
    default:
      return unidad.toLowerCase();
  }
}
