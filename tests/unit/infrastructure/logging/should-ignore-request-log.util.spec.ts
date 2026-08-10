import { shouldIgnoreRequestLog } from '@infrastructure/logging/should-ignore-request-log.util';

describe('shouldIgnoreRequestLog', () => {
  it('ignora o health check', () => {
    expect(shouldIgnoreRequestLog('/health')).toBe(true);
  });

  it('ignora assets do swagger', () => {
    expect(shouldIgnoreRequestLog('/docs')).toBe(true);
    expect(shouldIgnoreRequestLog('/docs/swagger-ui-bundle.js')).toBe(true);
    expect(shouldIgnoreRequestLog('/docs-json')).toBe(true);
  });

  it('ignora query strings ao comparar o path', () => {
    expect(shouldIgnoreRequestLog('/health?verbose=true')).toBe(true);
  });

  it('nao ignora rotas de negocio', () => {
    expect(shouldIgnoreRequestLog('/v1/messages')).toBe(false);
  });

  it('nao ignora quando a url esta ausente', () => {
    expect(shouldIgnoreRequestLog(undefined)).toBe(false);
  });
});
