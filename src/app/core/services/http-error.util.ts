import { HttpErrorResponse } from '@angular/common/http';

function isHtmlResponse(body: string): boolean {
  const trimmed = body.trim().toLowerCase();
  return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html');
}

function messageForHttpStatus(status: number): string {
  if (status === 404) return 'Ruta no encontrada en el servidor. Verifica la URL del API.';
  if (status === 0) return 'No se pudo conectar con el servidor';
  if (status === 401) return 'Sesión expirada o no autorizado';
  if (status === 403) return 'No tienes permiso para esta acción';
  return 'Error en la solicitud al servidor';
}

export function parseApiError(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error;
    if (body && typeof body === 'object') {
      if (body.status === false && body.mensaje) return String(body.mensaje);
      if (body.mensaje) return String(body.mensaje);
      if (body.message) return String(body.message);
      if (body.detail) return String(body.detail);
    }
    if (typeof body === 'string' && body.trim()) {
      return isHtmlResponse(body) ? messageForHttpStatus(error.status) : body;
    }
    if (error.status) return messageForHttpStatus(error.status);
  }

  if (error instanceof Error) return error.message;
  return fallback;
}
