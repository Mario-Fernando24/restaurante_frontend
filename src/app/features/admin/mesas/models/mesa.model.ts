export type MesaEstado = 'Activo' | 'Inactivo';

export interface Mesa {
  id_mesa: number;
  numero: string;
  zona: string;
  capacidad: number;
  estado: MesaEstado | string;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface CrearMesaRequest {
  numero: string;
  zona?: string;
  capacidad?: number;
}

export interface ActualizarMesaRequest {
  numero: string;
  zona?: string;
  capacidad?: number;
}

export interface MesaSalonItem {
  id_mesa: number;
  numero: string;
  zona: string;
  capacidad: number;
  estado: string;
  ocupada: boolean;
  comanda: MesaSalonComanda | null;
}

export interface MesaSalonComanda {
  id_comanda: number;
  total: string;
  items_count: number;
  fecha_apertura: string;
  mesero: string;
}
