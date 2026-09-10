import { describe, expect, it } from 'vitest';

import { sendTemplateFormSchema } from '../../../src/modules/messages/send-template-form.schema';

const validForm = {
  phoneNumberId: 'c2874e62-45fc-4d29-9142-92ff2be9d3e6',
  to: '5544999999999',
  templateId: '123456789012345',
};

describe('sendTemplateFormSchema', () => {
  it('aceita o identificador não UUID retornado pela Meta', () => {
    expect(sendTemplateFormSchema.safeParse(validForm).success).toBe(true);
  });

  it('rejeita quando nenhum modelo foi selecionado', () => {
    expect(sendTemplateFormSchema.safeParse({ ...validForm, templateId: '' }).success).toBe(false);
  });

  it('rejeita identificadores maiores que o contrato do backend', () => {
    expect(
      sendTemplateFormSchema.safeParse({
        ...validForm,
        templateId: 'a'.repeat(256),
      }).success,
    ).toBe(false);
  });
});
