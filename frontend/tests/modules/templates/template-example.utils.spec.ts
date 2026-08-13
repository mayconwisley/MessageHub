import { describe, expect, it } from 'vitest';
import { bodyExampleValues } from '../../../src/modules/templates/template-example.utils';

describe('bodyExampleValues', () => {
  it.each([
    [{ example: { bodyText: [['Maycon', 'Maria']] } }, ['Maycon', 'Maria']],
    [{ example: { bodyText: [{ values: ['Maycon'] }] } }, ['Maycon']],
    [{ example: { body_text: [{ values: ['Maycon'] }] } }, ['Maycon']],
    [{ example: { bodyText: [[1]] } }, []],
    [undefined, []],
  ])('normaliza exemplos de formatos compatíveis', (component, expected) => {
    expect(bodyExampleValues(component)).toEqual(expected);
  });
});
