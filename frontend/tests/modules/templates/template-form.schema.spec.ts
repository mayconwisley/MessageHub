import { describe, expect, it } from 'vitest';
import { templateFormSchema, type TemplateFormData } from '../../../src/modules/templates/template-form.schema';

const validData: TemplateFormData = {
  tenantId: '8fca53f1-05be-4dd9-bce7-a5e7aa0fc215',
  whatsAppAccountId: 'bb1db40c-7caf-4a3f-abff-b1c598da37e6',
  name: 'aviso_de_pagamento',
  language: 'pt_BR',
  category: 'UTILITY',
  bodyText: 'Olá, {{1}}',
  hasUrlButton: false,
};

describe('templateFormSchema', () => {
  it('aceita um formulário de modelo válido sem botão de URL', () => {
    expect(templateFormSchema.safeParse(validData).success).toBe(true);
  });

  it('rejeita nome que não respeita o contrato da Meta', () => {
    const result = templateFormSchema.safeParse({ ...validData, name: 'Aviso de pagamento' });

    expect(result.success).toBe(false);
  });

  it('exige todos os dados do botão quando ele está habilitado', () => {
    const result = templateFormSchema.safeParse({ ...validData, hasUrlButton: true, buttonText: 'Ver pagamento' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors).toMatchObject({
        buttonUrl: ['Informe uma URL válida.'],
        buttonUrlExample: ['Informe uma URL de exemplo válida.'],
      });
    }
  });
});
