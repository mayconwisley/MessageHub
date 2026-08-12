import { TemplateExamplesValidator } from '@modules/templates/application/services/template-examples.validator';

describe('TemplateExamplesValidator', () => {
  it('accepts body examples with every positional parameter', () => {
    const result = TemplateExamplesValidator.validate({
      components: [
        {
          type: 'BODY',
          text: 'Olá {{1}}, pedido {{2}}.',
          example: { bodyText: [['Maria', 'PED-42']] },
        },
      ],
    });

    expect(result.isSuccess).toBe(true);
  });

  it('rejects a parameterized body without examples', () => {
    const result = TemplateExamplesValidator.validate({
      components: [{ type: 'BODY', text: 'Olá {{1}}.' }],
    });

    expect(result.isFailure).toBe(true);
    expect(result.error.code).toBe('INVALID_TEMPLATE_EXAMPLES');
  });

  it('rejects samples that do not cover all placeholders', () => {
    const result = TemplateExamplesValidator.validate({
      components: [
        { type: 'BODY', text: 'Olá {{1}}, pedido {{2}}.', example: { bodyText: [['Maria']] } },
      ],
    });

    expect(result.isFailure).toBe(true);
  });

  it('requires sequential positional placeholders', () => {
    const result = TemplateExamplesValidator.validate({
      components: [
        { type: 'BODY', text: 'Olá {{1}} e {{3}}.', example: { bodyText: [['Maria', 'PED-42']] } },
      ],
    });

    expect(result.isFailure).toBe(true);
  });
});
