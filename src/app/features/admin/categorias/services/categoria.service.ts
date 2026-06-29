import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '../../../../core/services/api.service';
import { extractApiEntity, extractApiList } from '../../../../core/services/api-response.util';
import { parseApiError } from '../../../../core/services/http-error.util';
import {
  Categoria,
  CategoriaEstado,
  CategoriaMutationResponse,
  CategoriaQueryParams,
  CrearCategoriaRequest,
  PaginatedResult,
} from '../models/categoria.model';

const CATEGORIAS_ENDPOINT = '/categorias';

@Injectable({ providedIn: 'root' })
export class CategoriaService {
  constructor(private api: ApiService) {}

  getCategorias(params: CategoriaQueryParams = {}): Observable<PaginatedResult<Categoria>> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const search = params.search?.trim() ?? '';

    // Backend (Postman): GET /api/categorias — sin query params ni barra final
    return this.api.get<unknown>(CATEGORIAS_ENDPOINT).pipe(
      map((response) => this.toPaginatedResult(response, page, pageSize, search)),
      catchError((error) =>
        throwError(() => new Error(parseApiError(error, 'Error al cargar las categorías')))
      )
    );
  }

  crearCategoria(payload: CrearCategoriaRequest): Observable<Categoria> {
    return this.api
      .post<CategoriaMutationResponse>(`${CATEGORIAS_ENDPOINT}/crear`, {
        nombre: payload.nombre.trim(),
        descripcion: payload.descripcion.trim(),
      })
      .pipe(
        map((response) => this.extractCategoria(response, 'No se pudo crear la categoría')),
        catchError((error) =>
          throwError(() => new Error(parseApiError(error, 'Error al crear la categoría')))
        )
      );
  }

  cambiarEstado(id: number, nuevoEstado: CategoriaEstado): Observable<Categoria> {
    return this.api
      .post<CategoriaMutationResponse>(`${CATEGORIAS_ENDPOINT}/${id}`, {
        nuevo_estado: nuevoEstado,
      })
      .pipe(
        map((response) =>
          this.extractCategoria(response, 'No se pudo actualizar la categoría')
        ),
        catchError((error) =>
          throwError(() => new Error(parseApiError(error, 'Error al cambiar el estado')))
        )
      );
  }

  getEstadoOpuesto(estado: string): CategoriaEstado {
    return estado.toLowerCase() === 'activo' ? 'Inactivo' : 'Activo';
  }

  private toPaginatedResult(
    response: unknown,
    page: number,
    pageSize: number,
    search: string
  ): PaginatedResult<Categoria> {
    let items = extractApiList<Categoria>(
      response,
      'No se pudieron cargar las categorías'
    ).map((item) => this.normalize(item));

    if (search) {
      const term = search.toLowerCase();
      items = items.filter(
        (c) =>
          c.nombre.toLowerCase().includes(term) ||
          c.descripcion.toLowerCase().includes(term) ||
          c.estado.toLowerCase().includes(term)
      );
    }

    const total = items.length;
    const start = (page - 1) * pageSize;
    const pagedItems = items.slice(start, start + pageSize);

    return { items: pagedItems, total, page, pageSize };
  }

  private extractCategoria(
    response: CategoriaMutationResponse | Categoria,
    fallback: string
  ): Categoria {
    if ('id_categoria' in response) {
      return this.normalize(response);
    }

    return this.normalize(extractApiEntity<Categoria>(response, ['body'], fallback));
  }

  private normalize(raw: Categoria): Categoria {
    return {
      id_categoria: Number(raw.id_categoria),
      nombre: String(raw.nombre ?? ''),
      descripcion: String(raw.descripcion ?? ''),
      estado: String(raw.estado ?? ''),
      fecha_creacion: String(raw.fecha_creacion ?? ''),
      fecha_actualizacion: String(raw.fecha_actualizacion ?? ''),
    };
  }
}
