import { HttpErrorResponse } from '@angular/common/http';

function isHtmlResponse(body: string): boolean {
  const trimmed = body.trim().toLowerCase();
  return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html');
}

function messageForHttpStatus(status: number): string {
  if (status === 404) return 'Ruta no encontrada en el servidor. Verifica la URL del API.';
  if (status === 0) return 'No se pudo conectar con el servidor. ¿Está Django corriendo en el puerto 8000?';
  if (status === 401) return 'Sesión expirada o no autorizado';
  if (status === 403) return 'No tienes permiso para esta acción';
  if (status === 502 || status === 503 || status === 504) {
    return 'El servidor backend no responde. Inicia Django (puerto 8000) y recarga la página.';
  }
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
      if (body.includes('trying to proxy')) {
        return 'El servidor backend no responde. Inicia Django en el puerto 8000 y recarga la página.';
      }
      return isHtmlResponse(body) ? messageForHttpStatus(error.status) : body;
    }
    if (error.status) return messageForHttpStatus(error.status);
  }

  if (error instanceof Error) return error.message;
  return fallback;
}
