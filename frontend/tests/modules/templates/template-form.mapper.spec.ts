import { describe, expect, it } from 'vitest';
import {
  toMutationData,
  toTemplateComponents,
} from '../../../src/modules/templates/template-form.mapper';
import type { TemplateFormData } from '../../../src/modules/templates/template-form.schema';

const formData: TemplateFormData = {
  tenantId: '8fca53f1-05be-4dd9-bce7-a5e7aa0fc215',
  whatsAppAccountId: 'bb1db40c-7caf-4a3f-abff-b1c598da37e6',
  name: ' aviso_de_pagamento ',
  language: 'pt_BR',
  category: 'UTILITY',
  headerText: ' Aviso importante ',
  bodyText: ' Olá, {{1}} ',
  bodyExamples: ' Maycon, Maria , ',
  footerText: ' Não responda esta mensagem ',
  hasUrlButton: true,
  buttonText: ' Acessar ',
  buttonUrl: ' https://example.com/pagamento/{{1}} ',
  buttonUrlExample: ' https://example.com/pagamento/123 ',
};

describe('toTemplateComponents', () => {
  it('transforma o formulário no contrato explícito da API', () => {
    expect(toTemplateComponents(formData)).toEqual([
      { type: 'HEADER', format: 'TEXT', text: 'Aviso importante' },
      {
        type: 'BODY',
        text: 'Olá, {{1}}',
        example: { bodyText: [{ values: ['Maycon', 'Maria'] }] },
      },
      { type: 'FOOTER', text: 'Não responda esta mensagem' },
      {
        type: 'BUTTONS',
        buttons: [
          {
            type: 'URL',
            text: 'Acessar',
            url: 'https://example.com/pagamento/{{1}}',
            example: 'https://example.com/pagamento/123',
          },
        ],
      },
    ]);
  });

  it('não cria componentes opcionais sem conteúdo', () => {
    expect(
      toTemplateComponents({
        ...formData,
        headerText: ' ',
        bodyExamples: ' , ',
        footerText: undefined,
        hasUrlButton: false,
      }),
    ).toEqual([{ type: 'BODY', text: 'Olá, {{1}}' }]);
  });
});

describe('toMutationData', () => {
  it('preserva os identificadores e normaliza o nome do modelo', () => {
    expect(toMutationData(formData)).toMatchObject({
      tenantId: formData.tenantId,
      whatsAppAccountId: formData.whatsAppAccountId,
      name: 'aviso_de_pagamento',
      components: expect.any(Array),
    });
  });
});
