import { VentaDetalle } from './venta.model';

export interface ComandaDetalleItem {
  id_producto: number;
  producto: string;
  cantidad: string;
  precio_unitario: string;
  subtotal: string;
  observacion?: string;
}

export interface Comanda {
  id_comanda: number;
  id_mesa: number;
  mesa: string;
  zona: string;
  estado: 'ABIERTA' | 'CERRADA' | 'ANULADA';
  total: string;
  observacion: string;
  id_cliente: number | null;
  cliente: string | null;
  mesero: string;
  fecha_apertura: string;
  fecha_cierre: string | null;
  id_venta: number | null;
  detalle: ComandaDetalleItem[];
}

export interface ComandaMesaResponse {
  mesa: {
    id_mesa: number;
    numero: string;
    zona: string;
    capacidad: number;
    estado: string;
  };
  comanda: Comanda | null;
}

export interface ActualizarComandaItemsRequest {
  detalle: { id_producto: number; cantidad: number; observacion?: string }[];
  id_cliente?: number | null;
  observacion?: string;
}

export interface CobrarComandaResponse {
  venta: VentaDetalle;
  comanda: Comanda;
}
