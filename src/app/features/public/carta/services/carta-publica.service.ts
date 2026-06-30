import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '../../../../core/services/api.service';
import { extractApiEntity } from '../../../../core/services/api-response.util';
import { parseApiError } from '../../../../core/services/http-error.util';
import { CartaPublica } from '../models/carta.model';

const CARTA_ENDPOINT = '/publico/carta';

@Injectable({ providedIn: 'root' })
export class CartaPublicaService {
  constructor(private api: ApiService) {}

  getCarta(): Observable<CartaPublica> {
    return this.api.get<unknown>(CARTA_ENDPOINT).pipe(
      map((response) =>
        extractApiEntity<CartaPublica>(response, ['body'], 'No se pudo cargar la carta')
      ),
      catchError((error) =>
        throwError(() => new Error(parseApiError(error, 'Error al cargar la carta')))
      )
    );
  }

  resolveImagenUrl(imagen?: string | null): string | null {
    if (!imagen) return null;
    if (imagen.startsWith('http')) return imagen;
    // Rutas /media/... pasan por el mismo origen (proxy en desarrollo)
    return imagen.startsWith('/') ? imagen : `/${imagen}`;
  }

  /** URL pública de la carta para QR (misma origen que el frontend). */
  getCartaPublicUrl(): string {
    if (typeof window === 'undefined') return '/carta';
    return `${window.location.origin}/carta`;
  }
}
