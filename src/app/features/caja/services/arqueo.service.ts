import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { extractApiEntity, extractApiList } from '../../../core/services/api-response.util';
import { parseApiError } from '../../../core/services/http-error.util';
import {
  AbrirArqueoRequest,
  Arqueo,
  ArqueoMutationResponse,
  ArqueoQueryParams,
  CerrarArqueoRequest,
  PaginatedResult,
} from '../models/arqueo.model';
import { BehaviorSubject } from 'rxjs';

const ARQUEOS_ENDPOINT = '/arqueos';

@Injectable({ providedIn: 'root' })
export class ArqueoService {
  private readonly activoSubject = new BehaviorSubject<Arqueo | null>(null);
  readonly arqueoActivo$ = this.activoSubject.asObservable();

  constructor(private api: ApiService) {}

  getArqueos(params: ArqueoQueryParams = {}): Observable<PaginatedResult<Arqueo>> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const search = params.search?.trim() ?? '';

    const query: Record<string, string> = {
      page: String(page),
      limit: String(pageSize),
    };
    if (search) query['search'] = search;

    return this.api.get<unknown>(ARQUEOS_ENDPOINT, query).pipe(
      map((response) => this.toPaginatedResult(response, page, pageSize, search)),
      catchError((error) =>
        throwError(() => new Error(parseApiError(error, 'Error al cargar los arqueos')))
      )
    );
  }

  getArqueoActivo(): Observable<Arqueo | null> {
    return this.api.get<unknown>(`${ARQUEOS_ENDPOINT}/activo`).pipe(
      map((response) => {
        try {
          const arqueo = extractApiEntity<Arqueo>(response, ['body'], '');
          return this.normalize(arqueo);
        } catch {
          return null;
        }
      }),
      tap((arqueo) => this.activoSubject.next(arqueo)),
      catchError((error) =>
        throwError(() => new Error(parseApiError(error, 'Error al consultar el turno activo')))
      )
    );
  }

  abrirArqueo(payload: AbrirArqueoRequest): Observable<Arqueo> {
    return this.api
      .post<ArqueoMutationResponse>(`${ARQUEOS_ENDPOINT}/abrir`, {
        monto_apertura: payload.monto_apertura,
        observacion: payload.observacion?.trim() || undefined,
      })
      .pipe(
        map((response) => this.extractArqueo(response, 'No se pudo abrir el turno')),
        tap((arqueo) => this.activoSubject.next(arqueo)),
        catchError((error) =>
          throwError(() => new Error(parseApiError(error, 'Error al abrir el turno')))
        )
      );
  }

  cerrarArqueo(id: number, payload: CerrarArqueoRequest): Observable<Arqueo> {
    return this.api
      .post<ArqueoMutationResponse>(`${ARQUEOS_ENDPOINT}/${id}/cerrar`, {
        monto_cierre_real: payload.monto_cierre_real,
        observacion: payload.observacion?.trim() || undefined,
      })
      .pipe(
        map((response) => this.extractArqueo(response, 'No se pudo cerrar el turno')),
        tap(() => this.activoSubject.next(null)),
        catchError((error) =>
          throwError(() => new Error(parseApiError(error, 'Error al cerrar el turno')))
        )
      );
  }

  isAbierto(arqueo: Arqueo | null): boolean {
    return !!arqueo && arqueo.estado.toLowerCase() === 'abierto';
  }

  private toPaginatedResult(
    response: unknown,
    page: number,
    pageSize: number,
    search: string
  ): PaginatedResult<Arqueo> {
    let items = extractApiList<Arqueo>(response, 'No se pudieron cargar los arqueos').map(
      (item) => this.normalize(item)
    );

    if (search) {
      const term = search.toLowerCase();
      items = items.filter(
        (a) =>
          a.estado.toLowerCase().includes(term) ||
          (a.cajero ?? '').toLowerCase().includes(term)
      );
    }

    const total = items.length;
    const start = (page - 1) * pageSize;
    return { items: items.slice(start, start + pageSize), total, page, pageSize };
  }

  private extractArqueo(response: ArqueoMutationResponse | Arqueo, fallback: string): Arqueo {
    if ('id_arqueo' in response) return this.normalize(response);
    return this.normalize(extractApiEntity<Arqueo>(response, ['body'], fallback));
  }

  private normalize(raw: Arqueo): Arqueo {
    return {
      id_arqueo: Number(raw.id_arqueo),
      id_usuario: raw.id_usuario != null ? Number(raw.id_usuario) : undefined,
      cajero: raw.cajero ? String(raw.cajero) : undefined,
      monto_apertura: Number(raw.monto_apertura ?? 0),
      monto_cierre: raw.monto_cierre != null ? Number(raw.monto_cierre) : undefined,
      monto_cierre_real:
        raw.monto_cierre_real != null ? Number(raw.monto_cierre_real) : undefined,
      monto_efectivo_esperado:
        raw.monto_efectivo_esperado != null ? Number(raw.monto_efectivo_esperado) : undefined,
      diferencia: raw.diferencia != null ? Number(raw.diferencia) : undefined,
      observacion: raw.observacion ? String(raw.observacion) : undefined,
      estado: String(raw.estado ?? ''),
      fecha_apertura: String(raw.fecha_apertura ?? ''),
      fecha_cierre: raw.fecha_cierre ? String(raw.fecha_cierre) : undefined,
    };
  }
}
