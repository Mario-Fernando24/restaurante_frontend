import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '../../../../core/services/api.service';
import { extractApiEntity } from '../../../../core/services/api-response.util';
import { parseApiError } from '../../../../core/services/http-error.util';
import { ReporteAdministrativo, ReporteQueryParams } from '../models/reporte.model';

const REPORTE_ENDPOINT = '/reportes/administrativo';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  constructor(private api: ApiService) {}

  getReporteAdministrativo(params: ReporteQueryParams = {}): Observable<ReporteAdministrativo> {
    const query: Record<string, string> = {};
    if (params.fecha_desde) query['fecha_desde'] = params.fecha_desde;
    if (params.fecha_hasta) query['fecha_hasta'] = params.fecha_hasta;
    if (params.id_cliente != null) query['id_cliente'] = String(params.id_cliente);
    if (params.id_arqueo != null) query['id_arqueo'] = String(params.id_arqueo);
    if (params.id_proveedor != null) query['id_proveedor'] = String(params.id_proveedor);

    return this.api.get<unknown>(REPORTE_ENDPOINT, query).pipe(
      map((response) =>
        extractApiEntity<ReporteAdministrativo>(
          response,
          ['body'],
          'No se pudo generar el reporte'
        )
      ),
      catchError((error) =>
        throwError(() => new Error(parseApiError(error, 'Error al cargar el reporte')))
      )
    );
  }
}
