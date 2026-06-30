import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { extractApiEntity, extractApiList } from '../../../core/services/api-response.util';
import { parseApiError } from '../../../core/services/http-error.util';
import {
  CrearVentaRequest,
  MetodoPago,
  VentaDetalle,
  VentaMutationResponse,
} from '../models/venta.model';

const VENTAS_ENDPOINT = '/ventas';
const METODOS_PAGO_ENDPOINT = '/metodos-pago';

@Injectable({ providedIn: 'root' })
export class VentaService {
  constructor(private api: ApiService) {}

  getMetodosPago(): Observable<MetodoPago[]> {
    return this.api.get<unknown>(METODOS_PAGO_ENDPOINT).pipe(
      map((response) =>
        extractApiList<Record<string, unknown>>(response, 'No se pudieron cargar los métodos de pago').map(
          (item) => this.normalizeMetodo(item)
        )
      ),
      catchError((error) =>
        throwError(() => new Error(parseApiError(error, 'Error al cargar métodos de pago')))
      )
    );
  }

  crearVenta(payload: CrearVentaRequest): Observable<VentaDetalle> {
    const body: Record<string, unknown> = {
      detalle: payload.detalle,
    };

    if (payload.id_cliente != null) {
      body['id_cliente'] = payload.id_cliente;
    }

    if (payload.es_cortesia) {
      body['es_cortesia'] = true;
      body['observacion_cortesia'] = payload.observacion_cortesia ?? '';
    } else if (payload.pagos) {
      body['pagos'] = payload.pagos;
    }

    return this.api.post<VentaMutationResponse>(`${VENTAS_ENDPOINT}/crear`, body).pipe(
      map((response) => this.extractVenta(response, 'No se pudo registrar la venta')),
      catchError((error) =>
        throwError(() => new Error(parseApiError(error, 'Error al registrar la venta')))
      )
    );
  }

  obtenerVenta(idVenta: number): Observable<VentaDetalle> {
    return this.api.get<unknown>(`${VENTAS_ENDPOINT}/${idVenta}`).pipe(
      map((response) =>
        extractApiEntity<VentaDetalle>(response, ['body'], 'No se encontró la venta')
      ),
      catchError((error) =>
        throwError(() => new Error(parseApiError(error, 'Error al cargar la venta')))
      )
    );
  }

  private extractVenta(response: VentaMutationResponse | VentaDetalle, fallback: string): VentaDetalle {
    if ('id_venta' in response && 'detalle' in response) return response as VentaDetalle;
    if ('id_venta' in response) {
      return response as VentaDetalle;
    }
    return extractApiEntity<VentaDetalle>(response, ['body', 'venta'], fallback);
  }

  private normalizeMetodo(raw: Record<string, unknown>): MetodoPago {
    const code = String(raw['metodo_pago'] ?? raw['tipo'] ?? raw['codigo'] ?? '');
    return {
      metodo_pago: code,
      nombre: String(raw['nombre'] ?? code),
      requiere_referencia: Boolean(raw['requiere_referencia']),
      tipo: raw['tipo'] ? String(raw['tipo']) : undefined,
    };
  }
}
