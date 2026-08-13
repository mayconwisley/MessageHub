import { v7 as uuidv7 } from 'uuid';

/**
 * Reaproveita o `x-request-id` recebido do cliente para permitir rastreio
 * ponta-a-ponta (secao 26); gera um novo apenas quando ausente.
 */
export function resolveRequestId(headerValue: string | string[] | undefined): string {
  const candidate = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  return candidate && candidate.trim().length > 0 ? candidate : uuidv7();
}
