import type { TemplateComponent, TemplateMutationData } from './templates.api';
import type { TemplateFormData } from './template-form.schema';

export function toTemplateComponents(data: TemplateFormData): TemplateComponent[] {
  if (data.category === 'AUTHENTICATION') {
    return [
      {
        type: 'BODY',
        addSecurityRecommendation: data.addSecurityRecommendation ?? true,
      },
      {
        type: 'FOOTER',
        codeExpirationMinutes: data.codeExpirationMinutes ?? 5,
      },
      {
        type: 'BUTTONS',
        buttons: [{ type: 'OTP', otp_type: 'COPY_CODE', text: 'Copiar código' }],
      },
    ];
  }

  const components: TemplateComponent[] = [];
  if (data.headerText?.trim())
    components.push({
      type: 'HEADER',
      format: 'TEXT',
      text: data.headerText.trim(),
    });
  const examples =
    data.bodyExamples
      ?.split(',')
      .map((value) => value.trim())
      .filter(Boolean) ?? [];
  components.push({
    type: 'BODY',
    text: data.bodyText.trim(),
    ...(examples.length ? { example: { bodyText: [{ values: examples }] } } : {}),
  });
  if (data.footerText?.trim()) components.push({ type: 'FOOTER', text: data.footerText.trim() });
  if (data.hasUrlButton && data.buttonText && data.buttonUrl && data.buttonUrlExample)
    components.push({
      type: 'BUTTONS',
      buttons: [
        {
          type: 'URL',
          text: data.buttonText.trim(),
          url: data.buttonUrl.trim(),
          example: data.buttonUrlExample.trim(),
        },
      ],
    });
  return components;
}

export function toMutationData(data: TemplateFormData): TemplateMutationData {
  return {
    tenantId: data.tenantId,
    whatsAppAccountId: data.whatsAppAccountId,
    name: data.name.trim(),
    language: data.language,
    category: data.category,
    components: toTemplateComponents(data),
  };
}
