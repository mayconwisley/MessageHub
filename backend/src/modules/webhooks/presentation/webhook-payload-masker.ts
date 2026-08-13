const SENSITIVE_KEYS = new Set([
  'access_token',
  'authorization',
  'phone_number',
  'display_phone_number',
  'from',
  'to',
  'wa_id',
]);

function mask(value: string): string {
  if (value.length <= 4) return '****';
  return `${value.slice(0, 2)}***${value.slice(-2)}`;
}

/** Nunca entrega payload bruto no console operacional. */
export function maskWebhookPayload(value: unknown, key?: string): unknown {
  if (key && SENSITIVE_KEYS.has(key.toLowerCase())) {
    return typeof value === 'string' ? mask(value) : '[REDACTED]';
  }
  if (Array.isArray(value)) return value.map((item) => maskWebhookPayload(item));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([entryKey, entryValue]) => [
        entryKey,
        maskWebhookPayload(entryValue, entryKey),
      ]),
    );
  }
  return value;
}
