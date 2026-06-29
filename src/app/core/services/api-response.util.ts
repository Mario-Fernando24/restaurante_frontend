export function extractApiList<T>(
  response: unknown,
  fallback = 'No se pudieron cargar los datos'
): T[] {
  if (Array.isArray(response)) return response as T[];

  if (!response || typeof response !== 'object') {
    throw new Error(fallback);
  }

  const data = response as Record<string, unknown>;

  if (data['status'] === false || data['ok'] === false) {
    throw new Error(String(data['mensaje'] ?? data['message'] ?? fallback));
  }

  const listKeys = ['body', 'data', 'usuarios'];
  for (const key of listKeys) {
    const value = data[key];
    if (Array.isArray(value)) return value as T[];
  }

  throw new Error(fallback);
}

export function extractApiEntity<T>(
  response: unknown,
  entityKeys: string[],
  fallback: string
): T {
  if (!response || typeof response !== 'object') {
    throw new Error(fallback);
  }

  const data = response as Record<string, unknown>;

  if (data['status'] === false || data['ok'] === false) {
    throw new Error(String(data['mensaje'] ?? data['message'] ?? fallback));
  }

  for (const key of entityKeys) {
    const value = data[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as T;
    }
  }

  const body = data['body'];
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    return body as T;
  }

  throw new Error(String(data['mensaje'] ?? data['message'] ?? fallback));
}
