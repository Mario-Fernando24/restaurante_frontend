export interface CartaEmpresa {
  nombre_comercial: string;
  razon_social: string;
  direccion: string;
  ciudad: string;
  telefono: string;
  email: string;
  mensaje_bienvenida: string;
}

export interface CartaProducto {
  id_producto: number;
  nombre: string;
  descripcion: string;
  precio_venta: string;
  imagen: string | null;
}

export interface CartaPedidoItem {
  id_producto: number;
  nombre: string;
  precio_venta: number;
  cantidad: number;
}

export interface CartaCategoria {
  id_categoria: number;
  nombre: string;
  productos: CartaProducto[];
}

export interface CartaPublica {
  empresa: CartaEmpresa;
  categorias: CartaCategoria[];
  total_productos: number;
  generado_en: string;
}
