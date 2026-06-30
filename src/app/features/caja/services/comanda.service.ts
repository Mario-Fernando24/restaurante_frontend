import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { extractApiEntity } from '../../../core/services/api-response.util';
import { parseApiError } from '../../../core/services/http-error.util';
import {
  ActualizarComandaItemsRequest,
  CobrarComandaResponse,
  Comanda,
  ComandaMesaResponse,
} from '../models/comanda.model';
import { CrearVentaRequest, VentaDetalle } from '../models/venta.model';

const COMANDAS_ENDPOINT = '/comandas';

@Injectable({ providedIn: 'root' })
export class ComandaService {
  constructor(private api: ApiService) {}

  getComandaMesa(idMesa: number): Observable<ComandaMesaResponse> {
    return this.api.get<unknown>(`/mesas/${idMesa}/comanda`).pipe(
      map((response) =>
        extractApiEntity<ComandaMesaResponse>(response, ['body'], 'No se pudo cargar la mesa')
      ),
      catchError((error) =>
        throwError(() => new Error(parseApiError(error, 'Error al cargar la mesa')))
      )
    );
  }

  abrirComanda(idMesa: number, idCliente?: number): Observable<Comanda> {
    const body: Record<string, unknown> = { id_mesa: idMesa };
    if (idCliente != null) body['id_cliente'] = idCliente;

    return this.api.post<unknown>(`${COMANDAS_ENDPOINT}/abrir`, body).pipe(
      map((response) =>
        extractApiEntity<Comanda>(response, ['body'], 'No se pudo abrir la comanda')
      ),
      catchError((error) =>
        throwError(() => new Error(parseApiError(error, 'Error al abrir la comanda')))
      )
    );
  }

  actualizarItems(idComanda: number, payload: ActualizarComandaItemsRequest): Observable<Comanda> {
    return this.api.put<unknown>(`${COMANDAS_ENDPOINT}/${idComanda}/items`, payload).pipe(
      map((response) =>
        extractApiEntity<Comanda>(response, ['body'], 'No se pudo guardar el pedido')
      ),
      catchError((error) =>
        throwError(() => new Error(parseApiError(error, 'Error al guardar el pedido')))
      )
    );
  }

  cobrarComanda(idComanda: number, payload: CrearVentaRequest): Observable<CobrarComandaResponse> {
    const body: Record<string, unknown> = {};
    if (payload.id_cliente != null) body['id_cliente'] = payload.id_cliente;
    if (payload.es_cortesia) {
      body['es_cortesia'] = true;
      body['observacion_cortesia'] = payload.observacion_cortesia ?? '';
    } else if (payload.pagos) {
      body['pagos'] = payload.pagos;
    }

    return this.api.post<unknown>(`${COMANDAS_ENDPOINT}/${idComanda}/cobrar`, body).pipe(
      map((response) => {
        const data = extractApiEntity<Record<string, unknown>>(response, ['body'], 'No se pudo cobrar');
        return {
          venta: data['venta'] as VentaDetalle,
          comanda: data['comanda'] as Comanda,
        };
      }),
      catchError((error) =>
        throwError(() => new Error(parseApiError(error, 'Error al cobrar la mesa')))
      )
    );
  }

  anularComanda(idComanda: number): Observable<Comanda> {
    return this.api.post<unknown>(`${COMANDAS_ENDPOINT}/${idComanda}/anular`, {}).pipe(
      map((response) =>
        extractApiEntity<Comanda>(response, ['body'], 'No se pudo liberar la mesa')
      ),
      catchError((error) =>
        throwError(() => new Error(parseApiError(error, 'Error al liberar la mesa')))
      )
    );
  }
}
