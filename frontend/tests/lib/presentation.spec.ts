import { describe, expect, it } from 'vitest';
import { toPresentationLabel, toPresentationValue } from '../../src/lib/presentation';

describe('presentation', () => {
  it('traduz campos e valores conhecidos', () => {
    expect(toPresentationLabel('providerMessageId')).toBe('ID da mensagem no provedor');
    expect(toPresentationValue('status', 'DELIVERED')).toBe('Entregue');
  });

  it('formata valores comuns e preserva valores desconhecidos', () => {
    expect(toPresentationValue('status', null)).toBe('—');
    expect(toPresentationValue('status', true)).toBe('Sim');
    expect(toPresentationValue('custom', 42)).toBe('42');
    expect(toPresentationValue('custom', 'externo')).toBe('externo');
  });
});
