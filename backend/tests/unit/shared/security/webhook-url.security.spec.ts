import { assertWebhookUrlFormat } from '@shared/security';

describe('assertWebhookUrlFormat', () => {
  it.each([
    'http://callback.example.com/events',
    'https://localhost/events',
    'https://api.localhost/events',
    'https://127.0.0.1/events',
    'https://10.0.0.10/events',
    'https://169.254.169.254/latest/meta-data',
    'https://[::1]/events',
    'https://user:password@callback.example.com/events',
    // Codificações alternativas de 127.0.0.1 que alguns resolvers (ex.: glibc) aceitam
    // mas que o formato canônico verificado por `net.isIP` não reconhece.
    'https://2130706433/events',
    'https://0x7f000001/events',
    'https://017700000001/events',
    'https://127.1/events',
    // Multicast IPv6 (ff00::/8).
    'https://[ff02::1]/events',
  ])('rejeita destino não público: %s', (url) => {
    expect(() => assertWebhookUrlFormat(url)).toThrow();
  });

  it('aceita um callback HTTPS com hostname público', () => {
    expect(() => assertWebhookUrlFormat('https://callbacks.example.com/events')).not.toThrow();
  });
});
