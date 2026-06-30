import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { extractApiEntity } from './api-response.util';
import { parseApiError } from './http-error.util';
import { Empresa, EmpresaUpdateRequest } from '../models/empresa.model';

const EMPRESA_ENDPOINT = '/empresa';
const EMPRESA_ACTUALIZAR_ENDPOINT = '/empresa/actualizar';

@Injectable({ providedIn: 'root' })
export class EmpresaService {
  private cache$?: Observable<Empresa>;

  constructor(private api: ApiService) {}

  getEmpresa(force = false): Observable<Empresa> {
    if (!force && this.cache$) {
      return this.cache$;
    }

    this.cache$ = this.api.get<unknown>(EMPRESA_ENDPOINT).pipe(
      map((response) =>
        extractApiEntity<Empresa>(response, ['body'], 'No se pudieron cargar los datos de la empresa')
      ),
      tap((empresa) => {
        this.cachedEmpresa = empresa;
      }),
      shareReplay(1),
      catchError((error) =>
        throwError(() => new Error(parseApiError(error, 'Error al cargar datos de la empresa')))
      )
    );

    return this.cache$;
  }

  private cachedEmpresa: Empresa | null = null;

  getEmpresaSync(): Empresa | null {
    return this.cachedEmpresa;
  }

  actualizarEmpresa(payload: EmpresaUpdateRequest): Observable<Empresa> {
    return this.api.put<unknown>(EMPRESA_ACTUALIZAR_ENDPOINT, payload).pipe(
      map((response) =>
        extractApiEntity<Empresa>(response, ['body'], 'No se pudieron guardar los datos')
      ),
      tap((empresa) => {
        this.cachedEmpresa = empresa;
        this.cache$ = of(empresa);
      }),
      catchError((error) =>
        throwError(() => new Error(parseApiError(error, 'Error al guardar datos de la empresa')))
      )
    );
  }
}
