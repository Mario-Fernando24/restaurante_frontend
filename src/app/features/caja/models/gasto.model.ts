export type GastoTipo = 'ADMINISTRATIVO' | 'NOMINA' | 'OTRO';

export interface Gasto {
  id_gasto: number;
  id_arqueo: number;
  tipo: GastoTipo;
  tipo_nombre: string;
  concepto: string;
  beneficiario?: string | null;
  monto: number | string;
  metodo_pago: string;
  referencia?: string | null;
  observacion?: string | null;
  registrado_por: string;
  fecha_registro: string;
}

export interface CrearGastoRequest {
  tipo: GastoTipo;
  concepto: string;
  beneficiario?: string;
  monto: number;
  metodo_pago: string;
  referencia?: string;
  observacion?: string;
}

export const GASTO_TIPO_LABELS: Record<GastoTipo, string> = {
  ADMINISTRATIVO: 'Gasto administrativo',
  NOMINA: 'Nómina / pago personal',
  OTRO: 'Otro egreso',
};
