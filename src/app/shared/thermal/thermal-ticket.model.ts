import { Empresa } from '../../core/models/empresa.model';

export type ThermalTicketTipo =
  | 'VENTA'
  | 'CORTESIA'
  | 'GASTO'
  | 'NOMINA'
  | 'CIERRE'
  | 'COMPRA';

export interface ThermalTicketLinea {
  producto: string;
  cantidad: string | number;
  precio: number;
  total: number;
}

export interface ThermalTicketMeta {
  label: string;
  value: string;
}

export interface ThermalTicket {
  tipo: ThermalTicketTipo;
  titulo: string;
  subtitulo?: string;
  numero: string;
  fecha: string;
  empresa: Empresa;
  cajero?: string;
  cliente?: string;
  proveedor?: string;
  beneficiario?: string;
  lineas: ThermalTicketLinea[];
  totalReferencia?: number;
  totalCobrado: number;
  totalQty?: number;
  observacion?: string;
  metodoPago?: string;
  metas?: ThermalTicketMeta[];
  pieExtra?: string;
}
