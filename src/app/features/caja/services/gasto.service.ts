import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { extractApiEntity, extractApiList } from '../../../core/services/api-response.util';
import { parseApiError } from '../../../core/services/http-error.util';
import { CrearGastoRequest, Gasto } from '../models/gasto.model';

const GASTOS_ENDPOINT = '/gastos';

@Injectable({ providedIn: 'root' })
export class GastoService {
  constructor(private api: ApiService) {}

  listarGastos(arqueoId?: number): Observable<Gasto[]> {
    const params = arqueoId ? { arqueo: String(arqueoId) } : undefined;
    return this.api.get<unknown>(GASTOS_ENDPOINT, params).pipe(
      map((response) =>
        extractApiList<Gasto>(response, 'No se pudieron cargar los egresos').map((gasto) =>
          this.normalizeGasto(gasto)
        )
      ),
      catchError((error) =>
        throwError(() => new Error(parseApiError(error, 'Error al cargar egresos')))
      )
    );
  }

  obtenerGasto(idGasto: number): Observable<Gasto> {
    return this.api.get<unknown>(`${GASTOS_ENDPOINT}/${idGasto}`).pipe(
      map((response) =>
        this.normalizeGasto(
          extractApiEntity<Gasto>(response, ['body'], 'No se encontró el egreso')
        )
      ),
      catchError((error) =>
        throwError(() => new Error(parseApiError(error, 'Error al cargar el egreso')))
      )
    );
  }

  crearGasto(payload: CrearGastoRequest): Observable<Gasto> {
    return this.api.post<unknown>(`${GASTOS_ENDPOINT}/crear`, payload).pipe(
      map((response) =>
        this.normalizeGasto(
          extractApiEntity<Gasto>(response, ['body'], 'No se pudo registrar el egreso')
        )
      ),
      catchError((error) =>
        throwError(() => new Error(parseApiError(error, 'Error al registrar el egreso')))
      )
    );
  }

  private normalizeGasto(raw: Gasto): Gasto {
    return {
      ...raw,
      monto: Number(raw.monto),
    };
  }
}
