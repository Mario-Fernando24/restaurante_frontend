import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { ApiService } from '../../../../core/services/api.service';
import { extractApiEntity, extractApiList } from '../../../../core/services/api-response.util';
import { parseApiError } from '../../../../core/services/http-error.util';
import {
  ActualizarProductoRequest,
  CrearProductoRequest,
  PaginatedResult,
  Producto,
  ProductoEstado,
  ProductoMutationResponse,
  ProductoQueryParams,
} from '../models/producto.model';

const PRODUCTOS_ENDPOINT = '/productos';

@Injectable({ providedIn: 'root' })
export class ProductoService {
  constructor(private api: ApiService) {}

  getProductos(params: ProductoQueryParams = {}): Observable<PaginatedResult<Producto>> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const search = params.search?.trim() ?? '';

    const query: Record<string, string> = {
      page: String(page),
      limit: String(pageSize),
    };
    if (search) query['search'] = search;

    return this.api.get<ProductoApiResponse>(PRODUCTOS_ENDPOINT, query).pipe(
      map((response) => {
        console.log('Raw API response:', response); // Debug log
        return this.toPaginatedResult(response, page, pageSize, search);
      }),
      catchError((error) =>
        throwError(() => new Error(parseApiError(error, 'Error al cargar los productos')))
      )
    );
  }

  crearProducto(payload: CrearProductoRequest): Observable<Producto> {
    return this.api
      .post<ProductoMutationResponse>(`${PRODUCTOS_ENDPOINT}/crear`, this.toJsonBody(payload))
      .pipe(
        map((response) => this.extractProducto(response, 'No se pudo crear el producto')),
        catchError((error) =>
          throwError(() => new Error(parseApiError(error, 'Error al crear el producto')))
        )
      );
  }

  actualizarProducto(id: number, payload: ActualizarProductoRequest): Observable<Producto> {
    return this.api
      .put<ProductoMutationResponse>(`${PRODUCTOS_ENDPOINT}/${id}/actualizar`, payload)
      .pipe(
        map((response) => this.extractProducto(response, 'No se pudo actualizar el producto')),
        catchError((error) =>
          throwError(() => new Error(parseApiError(error, 'Error al actualizar el producto')))
        )
      );
  }

  cambiarEstado(id: number, nuevoEstado: ProductoEstado): Observable<Producto> {
    return this.actualizarProducto(id, { estado: nuevoEstado });
  }

  getEstadoOpuesto(estado: string): ProductoEstado {
    return estado.toLowerCase() === 'activo' ? 'Inactivo' : 'Activo';
  }

  getImagenUrl(imagen?: string): string | null {
    if (!imagen) return null;
    if (imagen.startsWith('http')) return imagen;
    const base = environment.apiUrl.replace(/\/api\/?$/, '');
    return imagen.startsWith('/') ? `${base}${imagen}` : imagen;
  }

  private toJsonBody(payload: CrearProductoRequest): Record<string, unknown> {
    const body: Record<string, unknown> = {
      id_categoria: payload.id_categoria,
      nombre: payload.nombre.trim(),
      descripcion: payload.descripcion.trim(),
      precio_venta: payload.precio_venta,
      tipo_producto: payload.tipo_producto,
    };
    if (payload.imagen_base64) {
      body['imagen_base64'] = payload.imagen_base64;
    }
    return body;
  }

  private toPaginatedResult(
    response: ProductoApiResponse,
    page: number,
    pageSize: number,
    search: string
  ): PaginatedResult<Producto> {
    let items = extractApiList<Producto>(response, 'No se pudieron cargar los productos').map(
      (item) => this.normalize(item)
    );

    if (search) {
      const term = search.toLowerCase();
      items = items.filter(
        (p) =>
          p.nombre.toLowerCase().includes(term) ||
          p.descripcion.toLowerCase().includes(term) ||
          p.tipo_producto.toLowerCase().includes(term) ||
          p.estado.toLowerCase().includes(term) ||
          (p.categoria_nombre ?? '').toLowerCase().includes(term)
      );
    }

    const total = items.length;
    const start = (page - 1) * pageSize;
    return { items: items.slice(start, start + pageSize), total, page, pageSize };
  }

  private extractProducto(response: ProductoMutationResponse | Producto, fallback: string): Producto {
    if ('id_producto' in response) return this.normalize(response);
    return this.normalize(extractApiEntity<Producto>(response, ['body'], fallback));
  }

  private normalize(raw: Producto): Producto {
    return {
      id_producto: Number(raw.id_producto),
      id_categoria: Number(raw.id_categoria ?? 0),
      categoria_nombre: raw.categoria_nombre ? String(raw.categoria_nombre) : undefined,
      nombre: String(raw.nombre ?? ''),
      descripcion: String(raw.descripcion ?? ''),
      precio_venta: Number(raw.precio_venta ?? 0),
      tipo_producto: String(raw.tipo_producto ?? ''),
      imagen: raw.imagen ? String(raw.imagen) : undefined,
      estado: String(raw.estado ?? ''),
      fecha_creacion: raw.fecha_creacion ? String(raw.fecha_creacion) : undefined,
      fecha_actualizacion: raw.fecha_actualizacion ? String(raw.fecha_actualizacion) : undefined,
    };
  }
}

interface ProductoApiResponse {
  status?: boolean;
  body?: Producto[];
}
