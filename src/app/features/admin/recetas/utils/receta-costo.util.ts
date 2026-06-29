/** Costo de insumo usado en una línea de receta (cantidad × costo por unidad de medida). */
export function calcularCostoRecetaLinea(cantidadUsada: number, costoUnitario: number): number {
  return cantidadUsada * costoUnitario;
}

export function calcularGanancia(precioVenta: number, costoTotal: number): number {
  return precioVenta - costoTotal;
}

export function calcularMargenPorcentaje(precioVenta: number, ganancia: number): number | null {
  if (precioVenta <= 0) return null;
  return (ganancia / precioVenta) * 100;
}
