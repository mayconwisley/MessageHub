import { authStorage } from './auth-storage';

const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
export const SESSION_EXPIRED_EVENT = 'message-hub:session-expired';

export interface ApiValidationErrorDetail {
  field: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly requestId?: string,
    readonly details?: ApiValidationErrorDetail[],
  ) {
    super(message);
  }
}

interface ApiErrorPayload {
  message?: string | string[];
  code?: string;
  requestId?: string;
  details?: ApiValidationErrorDetail[];
}

type RequestOptions = Omit<RequestInit, 'body' | 'headers'> & {
  body?: unknown;
  headers?: Record<string, string>;
  authorization?: 'session' | 'none';
};

export function toQueryString<T extends Record<string, string | number | undefined>>(
  params: T,
): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, authorization = 'session', ...init } = options;
  const token = authorization === 'session' ? authStorage.getSessionToken() : null;
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    // A API usa Bearer token; nunca envie cookies ambientais por acidente.
    credentials: 'omit',
    cache: 'no-store',
    referrerPolicy: 'strict-origin-when-cross-origin',
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token && authorization !== 'none' ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;
    const message = Array.isArray(payload?.message)
      ? payload.message.join(' ')
      : (payload?.message ?? `A requisição falhou (${response.status}).`);
    if (response.status === 401 && authorization === 'session' && token) {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    throw new ApiError(
      message,
      response.status,
      payload?.code,
      payload?.requestId,
      payload?.details,
    );
  }
  if (response.status === 204) return undefined as T;

  const responseBody = await response.text();
  if (!responseBody.trim()) return undefined as T;

  return JSON.parse(responseBody) as T;
}

// Endpoints de health check retornam 503 quando alguma dependência está down,
// mas o corpo continua trazendo o status individual de cada componente — por
// isso não podemos tratar status HTTP não-2xx como falha total da requisição.
export async function requestHealth<T>(path: string): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    credentials: 'omit',
    cache: 'no-store',
    referrerPolicy: 'strict-origin-when-cross-origin',
  });
  return response.json() as Promise<T>;
}
