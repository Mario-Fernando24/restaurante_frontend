import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '../../../../core/services/api.service';
import {
  Categoria,
  CategoriaApiResponse,
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

    const query: Record<string, string> = {
      page: String(page),
      limit: String(pageSize),
    };

    if (search) {
      query['search'] = search;
    }

    return this.api.get<CategoriaApiResponse>(CATEGORIAS_ENDPOINT, query).pipe(
      map((response) => this.toPaginatedResult(response, page, pageSize, search)),
      catchError((error) =>
        throwError(() => new Error(this.parseError(error, 'Error al cargar las categorías')))
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
          throwError(() => new Error(this.parseError(error, 'Error al crear la categoría')))
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
          throwError(() => new Error(this.parseError(error, 'Error al cambiar el estado')))
        )
      );
  }

  getEstadoOpuesto(estado: string): CategoriaEstado {
    return estado.toLowerCase() === 'activo' ? 'Inactivo' : 'Activo';
  }

  private toPaginatedResult(
    response: CategoriaApiResponse,
    page: number,
    pageSize: number,
    search: string
  ): PaginatedResult<Categoria> {
    if (!response?.status || !Array.isArray(response.body)) {
      throw new Error('No se pudieron cargar las categorías');
    }

    let items = response.body.map((item) => this.normalize(item));

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

    if (response?.status === false) {
      throw new Error(String(response.mensaje ?? response.message ?? fallback));
    }

    if (response?.body) {
      return this.normalize(response.body);
    }

    throw new Error(String(response?.mensaje ?? response?.message ?? fallback));
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

  private parseError(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error;
      if (body && typeof body === 'object') {
        if (body.status === false && body.mensaje) return String(body.mensaje);
        if (body.mensaje) return String(body.mensaje);
        if (body.message) return String(body.message);
        if (body.detail) return String(body.detail);
      }
      if (typeof body === 'string' && body.trim()) return body;
    }

    if (error instanceof Error) return error.message;
    return fallback;
  }
}
