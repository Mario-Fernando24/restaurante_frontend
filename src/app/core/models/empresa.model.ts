export interface Empresa {
  id_empresa: number;
  razon_social: string;
  nombre_comercial: string;
  nit: string;
  direccion: string;
  ciudad: string;
  telefono: string;
  email: string;
  pie_ticket: string;
  fecha_actualizacion?: string;
}

export interface EmpresaUpdateRequest {
  razon_social: string;
  nombre_comercial: string;
  nit: string;
  direccion: string;
  ciudad: string;
  telefono: string;
  email: string;
  pie_ticket: string;
}
