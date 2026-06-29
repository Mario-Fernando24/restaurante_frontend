import { HttpInterceptorFn } from '@angular/common/http';

/** Quita barras finales del path — Django responde 404 con /api/categorias/ */
function stripTrailingSlash(url: string): string {
  const isRelative = url.startsWith('/');

  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const parsed = new URL(url, base);

    if (parsed.pathname.length > 1 && parsed.pathname.endsWith('/')) {
      parsed.pathname = parsed.pathname.replace(/\/+$/, '');
    }

    if (isRelative) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }

    return parsed.toString();
  } catch {
    return url.replace(/^(https?:\/\/[^?#]+?)\/+(?=[?#]|$)/, '$1');
  }
}

export const apiUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const normalized = stripTrailingSlash(req.url);
  if (normalized === req.url) {
    return next(req);
  }
  return next(req.clone({ url: normalized }));
};
