import { resolveRequestId } from '@infrastructure/logging/resolve-request-id.util';

describe('resolveRequestId', () => {
  it('reaproveita o header quando presente', () => {
    expect(resolveRequestId('client-request-id')).toBe('client-request-id');
  });

  it('usa o primeiro valor quando o header vem duplicado', () => {
    expect(resolveRequestId(['first-id', 'second-id'])).toBe('first-id');
  });

  it('gera um novo id quando o header esta ausente', () => {
    const requestId = resolveRequestId(undefined);
    expect(requestId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('gera um novo id quando o header vem em branco', () => {
    const requestId = resolveRequestId('   ');
    expect(requestId).toMatch(/^[0-9a-f-]{36}$/);
  });
});
