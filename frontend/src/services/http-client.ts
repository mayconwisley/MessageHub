import { authStorage } from './auth-storage';

const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

type RequestOptions = Omit<RequestInit, 'body' | 'headers'> & {
  body?: unknown;
  headers?: Record<string, string>;
  authorization?: 'session' | 'api-key' | 'none';
};

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, authorization = 'session', ...init } = options;
  const token = authorization === 'session' ? authStorage.getSessionToken() : authStorage.getApiKey();
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token && authorization !== 'none' ? { Authorization: `Bearer ${token}` } : {}), ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    const message = typeof payload === 'object' && payload && 'message' in payload ? String(payload.message) : `A requisição falhou (${response.status}).`;
    throw new ApiError(message, response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
