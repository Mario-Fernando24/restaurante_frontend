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
  ArqueoResumenCierre,
  CerrarArqueoRequest,
  PaginatedResult,
  TurnoDetalle,
  TurnoVentaDetalle,
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

  getArqueoDetalle(id: number): Observable<TurnoDetalle> {
    return this.api.get<unknown>(`${ARQUEOS_ENDPOINT}/${id}/detalle`).pipe(
      map((response) => this.normalizeDetalle(extractApiEntity<unknown>(response, ['body'], 'No se pudo cargar el detalle del turno'))),
      catchError((error) =>
        throwError(() => new Error(parseApiError(error, 'Error al cargar el detalle del turno')))
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
    const resumenRaw = (raw as Arqueo & { resumen?: Record<string, unknown> }).resumen;

    return {
      id_arqueo: Number(raw.id_arqueo),
      id_usuario: raw.id_usuario != null ? Number(raw.id_usuario) : undefined,
      cajero: raw.cajero ? String(raw.cajero) : undefined,
      monto_apertura: Number(raw.monto_apertura ?? 0),
      monto_cierre: raw.monto_cierre != null ? Number(raw.monto_cierre) : undefined,
      monto_cierre_real:
        raw.monto_cierre_real != null ? Number(raw.monto_cierre_real) : undefined,
      monto_cierre_esperado:
        raw.monto_cierre_esperado != null ? Number(raw.monto_cierre_esperado) : undefined,
      monto_efectivo_esperado:
        raw.monto_efectivo_esperado != null
          ? Number(raw.monto_efectivo_esperado)
          : raw.monto_cierre_esperado != null
            ? Number(raw.monto_cierre_esperado)
            : undefined,
      diferencia: raw.diferencia != null ? Number(raw.diferencia) : undefined,
      observacion: raw.observacion ? String(raw.observacion) : undefined,
      estado: String(raw.estado ?? ''),
      fecha_apertura: String(raw.fecha_apertura ?? ''),
      fecha_cierre: raw.fecha_cierre ? String(raw.fecha_cierre) : undefined,
      resumen: resumenRaw ? this.normalizeResumen(resumenRaw) : undefined,
    };
  }

  private normalizeResumen(raw: Record<string, unknown>): ArqueoResumenCierre {
    return {
      base_inicial: Number(raw['base_inicial'] ?? 0),
      ventas_efectivo: Number(raw['ventas_efectivo'] ?? 0),
      ventas_tarjeta: Number(raw['ventas_tarjeta'] ?? 0),
      ventas_transferencia: Number(raw['ventas_transferencia'] ?? 0),
      ventas_nequi: Number(raw['ventas_nequi'] ?? 0),
      ventas_daviplata: Number(raw['ventas_daviplata'] ?? 0),
      ventas_otros: Number(raw['ventas_otros'] ?? 0),
      total_ventas: Number(raw['total_ventas'] ?? 0),
      gastos_efectivo: Number(raw['gastos_efectivo'] ?? 0),
      total_gastos: Number(raw['total_gastos'] ?? 0),
      cantidad_cortesias: Number(raw['cantidad_cortesias'] ?? 0),
      valor_cortesias: Number(raw['valor_cortesias'] ?? 0),
      dinero_esperado: Number(raw['dinero_esperado'] ?? 0),
      cantidad_ventas: Number(raw['cantidad_ventas'] ?? 0),
    };
  }

  private normalizeDetalle(raw: unknown): TurnoDetalle {
    const data = (raw ?? {}) as Record<string, unknown>;

    return {
      arqueo: this.normalize((data['arqueo'] ?? {}) as Arqueo),
      resumen: this.normalizeResumen((data['resumen'] ?? {}) as Record<string, unknown>),
      pagos_por_metodo: this.normalizeList(data['pagos_por_metodo']).map((item) => ({
        metodo_pago: String(item['metodo_pago'] ?? ''),
        cantidad: Number(item['cantidad'] ?? 0),
        total: Number(item['total'] ?? 0),
      })),
      por_categoria: this.normalizeList(data['por_categoria']).map((item) => ({
        id_categoria: Number(item['id_categoria'] ?? 0),
        categoria: String(item['categoria'] ?? 'Sin categoría'),
        cantidad: Number(item['cantidad'] ?? 0),
        total: Number(item['total'] ?? 0),
      })),
      por_producto: this.normalizeList(data['por_producto']).map((item) => ({
        id_producto: Number(item['id_producto'] ?? 0),
        producto: String(item['producto'] ?? ''),
        id_categoria: Number(item['id_categoria'] ?? 0),
        categoria: String(item['categoria'] ?? 'Sin categoría'),
        cantidad: Number(item['cantidad'] ?? 0),
        total: Number(item['total'] ?? 0),
      })),
      ventas: this.normalizeList(data['ventas']).map((item) => this.normalizeVenta(item)),
      gastos: this.normalizeList(data['gastos']).map((item) => ({
        id_gasto: Number(item['id_gasto'] ?? 0),
        tipo: String(item['tipo'] ?? ''),
        tipo_nombre: String(item['tipo_nombre'] ?? ''),
        concepto: String(item['concepto'] ?? ''),
        beneficiario: item['beneficiario'] ? String(item['beneficiario']) : undefined,
        monto: Number(item['monto'] ?? 0),
        metodo_pago: String(item['metodo_pago'] ?? ''),
        fecha_registro: String(item['fecha_registro'] ?? ''),
      })),
    };
  }

  private normalizeVenta(raw: Record<string, unknown>): TurnoVentaDetalle {
    return {
      id_venta: Number(raw['id_venta'] ?? 0),
      total: Number(raw['total'] ?? 0),
      tipo_venta: raw['tipo_venta'] ? String(raw['tipo_venta']) : undefined,
      es_cortesia: Boolean(raw['es_cortesia']),
      observacion_cortesia: raw['observacion_cortesia']
        ? String(raw['observacion_cortesia'])
        : undefined,
      fecha_creacion: String(raw['fecha_creacion'] ?? ''),
      vendedor: raw['vendedor'] ? String(raw['vendedor']) : undefined,
      cliente: raw['cliente'] ? String(raw['cliente']) : undefined,
      detalle: this.normalizeList(raw['detalle']).map((linea) => ({
        id_producto: Number(linea['id_producto'] ?? 0),
        producto: String(linea['producto'] ?? ''),
        cantidad: Number(linea['cantidad'] ?? 0),
        subtotal: Number(linea['subtotal'] ?? 0),
      })),
      pagos: this.normalizeList(raw['pagos']).map((pago) => ({
        metodo_pago: String(pago['metodo_pago'] ?? ''),
        monto: Number(pago['monto'] ?? 0),
        referencia: pago['referencia'] ? String(pago['referencia']) : undefined,
        fecha_pago: pago['fecha_pago'] ? String(pago['fecha_pago']) : undefined,
      })),
    };
  }

  private normalizeList(value: unknown): Record<string, unknown>[] {
    return Array.isArray(value) ? value.map((item) => (item ?? {}) as Record<string, unknown>) : [];
  }
}
