import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '../../../../core/services/api.service';
import { extractApiEntity, extractApiList } from '../../../../core/services/api-response.util';
import { parseApiError } from '../../../../core/services/http-error.util';
import {
  ActualizarMesaRequest,
  CrearMesaRequest,
  Mesa,
  MesaEstado,
  MesaSalonItem,
} from '../models/mesa.model';

const MESAS_ENDPOINT = '/mesas';

@Injectable({ providedIn: 'root' })
export class MesaService {
  constructor(private api: ApiService) {}

  getMesas(): Observable<Mesa[]> {
    return this.api.get<unknown>(MESAS_ENDPOINT).pipe(
      map((response) =>
        extractApiList<Mesa>(response, 'No se pudieron cargar las mesas').map((m) =>
          this.normalize(m)
        )
      ),
      catchError((error) =>
        throwError(() => new Error(parseApiError(error, 'Error al cargar las mesas')))
      )
    );
  }

  getSalon(): Observable<MesaSalonItem[]> {
    return this.api.get<unknown>(`${MESAS_ENDPOINT}/salon`).pipe(
      map((response) => extractApiList<MesaSalonItem>(response, 'No se pudo cargar el salón')),
      catchError((error) =>
        throwError(() => new Error(parseApiError(error, 'Error al cargar las mesas')))
      )
    );
  }

  crearMesa(payload: CrearMesaRequest): Observable<Mesa> {
    return this.api.post<unknown>(`${MESAS_ENDPOINT}/crear`, payload).pipe(
      map((response) =>
        this.normalize(extractApiEntity<Mesa>(response, ['body'], 'No se pudo crear la mesa'))
      ),
      catchError((error) =>
        throwError(() => new Error(parseApiError(error, 'Error al crear la mesa')))
      )
    );
  }

  actualizarMesa(id: number, payload: ActualizarMesaRequest): Observable<Mesa> {
    return this.api.put<unknown>(`${MESAS_ENDPOINT}/${id}/actualizar`, payload).pipe(
      map((response) =>
        this.normalize(
          extractApiEntity<Mesa>(response, ['body'], 'No se pudo actualizar la mesa')
        )
      ),
      catchError((error) =>
        throwError(() => new Error(parseApiError(error, 'Error al actualizar la mesa')))
      )
    );
  }

  cambiarEstado(id: number, nuevoEstado: MesaEstado): Observable<Mesa> {
    return this.api.post<unknown>(`${MESAS_ENDPOINT}/${id}/estado`, { nuevo_estado: nuevoEstado }).pipe(
      map((response) =>
        this.normalize(
          extractApiEntity<Mesa>(response, ['body'], 'No se pudo cambiar el estado')
        )
      ),
      catchError((error) =>
        throwError(() => new Error(parseApiError(error, 'Error al cambiar el estado')))
      )
    );
  }

  getEstadoOpuesto(estado: string): MesaEstado {
    return estado.toLowerCase() === 'activo' ? 'Inactivo' : 'Activo';
  }

  private normalize(raw: Mesa): Mesa {
    return {
      id_mesa: Number(raw.id_mesa),
      numero: String(raw.numero ?? ''),
      zona: String(raw.zona ?? ''),
      capacidad: Number(raw.capacidad ?? 4),
      estado: String(raw.estado ?? 'Activo'),
      fecha_creacion: String(raw.fecha_creacion ?? ''),
      fecha_actualizacion: String(raw.fecha_actualizacion ?? ''),
    };
  }
}
