import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiUrl.replace(/\/$/, '');
  private readonly jsonHeaders = new HttpHeaders({
    'Content-Type': 'application/json',
    Accept: 'application/json',
  });

  constructor(private http: HttpClient) {}

  private url(path: string): string {
    const withLeadingSlash = path.startsWith('/') ? path : `/${path}`;
    // Django expone rutas sin barra final (ej. /api/categorias, no /api/categorias/)
    const withoutTrailingSlash = withLeadingSlash.replace(/\/+$/, '') || '/';
    return `${this.baseUrl}${withoutTrailingSlash}`;
  }

  get<T>(path: string, params?: Record<string, string>): Observable<T> {
    let requestUrl = this.url(path);

    if (params) {
      const query = new HttpParams({ fromObject: params }).toString();
      if (query) {
        requestUrl = `${requestUrl}?${query}`;
      }
    }

    return this.http.get<T>(requestUrl, {
      headers: this.jsonHeaders,
    });
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(this.url(path), body, {
      headers: this.jsonHeaders,
    });
  }

  postFormData<T>(path: string, body: FormData): Observable<T> {
    return this.http.post<T>(this.url(path), body);
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<T>(this.url(path), body, {
      headers: this.jsonHeaders,
    });
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(this.url(path), {
      headers: this.jsonHeaders,
    });
  }
}
