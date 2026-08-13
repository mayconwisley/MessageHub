import { lookup } from 'node:dns/promises';
import { Agent as HttpsAgent } from 'node:https';
import { isIP } from 'node:net';

const BLOCKED_HOSTNAMES = new Set(['localhost', 'localhost.localdomain']);

/**
 * O agente valida a resolução efetivamente usada pela conexão. Isso impede
 * que uma alteração de DNS entre a validação e o request desvie o callback
 * para uma rede privada.
 */
export const safeWebhookHttpsAgent = new HttpsAgent({
  lookup: (hostname, _options, callback) => {
    void lookup(hostname, { all: true, verbatim: true })
      .then((addresses) => {
        if (
          addresses.length === 0 ||
          addresses.some(({ address }) => isPrivateOrReservedAddress(address))
        ) {
          callback(
            new Error('O hostname do webhook não pode resolver para um endereço privado.'),
            '',
            4,
          );
          return;
        }

        const address = addresses[0];
        callback(null, address.address, address.family);
      })
      .catch((error: unknown) => callback(error as NodeJS.ErrnoException, '', 4));
  },
});

/**
 * Evita que callbacks configuráveis alcancem serviços internos. A resolução é
 * repetida no instante da entrega para reduzir o risco de DNS rebinding.
 */
export async function assertSafeWebhookUrl(value: string): Promise<void> {
  const url = parseWebhookUrl(value);
  const addresses = await lookup(url.hostname, { all: true, verbatim: true });

  if (
    addresses.length === 0 ||
    addresses.some(({ address }) => isPrivateOrReservedAddress(address))
  ) {
    throw new Error('A URL de webhook deve resolver exclusivamente para endereços públicos.');
  }
}

/** Validação síncrona para a fronteira HTTP, antes de persistir o callback. */
export function assertWebhookUrlFormat(value: string): void {
  parseWebhookUrl(value);
}

function parseWebhookUrl(value: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('A URL de webhook é inválida.');
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    BLOCKED_HOSTNAMES.has(hostname) ||
    hostname.endsWith('.localhost') ||
    (isIP(hostname) !== 0 && isPrivateOrReservedAddress(hostname))
  ) {
    throw new Error('A URL de webhook deve usar HTTPS e apontar para um host público.');
  }

  return url;
}

function isPrivateOrReservedAddress(address: string): boolean {
  if (isIP(address) === 4) return isPrivateOrReservedIpv4(address);
  if (isIP(address) === 6) return isPrivateOrReservedIpv6(address);
  return true;
}

function isPrivateOrReservedIpv4(address: string): boolean {
  const [first, second] = address.split('.').map(Number);
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    first >= 224 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && (second === 0 || second === 168)) ||
    (first === 198 && (second === 18 || second === 19)) ||
    (first === 198 && second === 51) ||
    (first === 203 && second === 0)
  );
}

function isPrivateOrReservedIpv6(address: string): boolean {
  const normalized = address.toLowerCase();
  return (
    normalized === '::' ||
    normalized === '::1' ||
    normalized.startsWith('::ffff:') ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    /^fe[89ab]/.test(normalized) ||
    normalized.startsWith('2001:db8:')
  );
}
