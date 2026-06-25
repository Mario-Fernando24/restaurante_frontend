import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '../../../../core/services/api.service';
import {
  Categoria,
  CategoriaApiResponse,
  CategoriaQueryParams,
  PaginatedResult,
} from '../models/categoria.model';

const CATEGORIAS_ENDPOINT = '/categorias';

@Injectable({ providedIn: 'root' })
export class CategoriaService {
  constructor(private api: ApiService) {}
  
  // Obtiene una lista paginada de categorías desde la API.
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
        throwError(() => new Error(this.parseError(error)))
      )
    );
  }

  // Convierte la respuesta de la API en un resultado paginado.
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
    // Asegura que el índice de inicio no sea negativo y que no exceda el total de elementos.
    const pagedItems = items.slice(start, start + pageSize);

    return { items: pagedItems, total, page, pageSize };
  }

  // Normaliza los datos de la categoría para asegurar que todos los campos tengan el tipo correcto.
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

  // Analiza el error recibido y devuelve un mensaje de error adecuado.
  private parseError(error: unknown): string {
    if (error instanceof Error) return error.message;
    return 'Error al cargar las categorías';
  }
}
