import { MetaMessageMapper } from '@infrastructure/meta/mappers/meta-message.mapper';
import { WhatsAppCredentialSource } from '@modules/whatsapp-accounts/domain/enums/whatsapp-credential-source.enum';
import { TemplateMessage } from '@modules/messages/domain/value-objects/template-message.value-object';

describe('MetaMessageMapper', () => {
  it('preserves the public parameters order in the Meta template BODY payload', () => {
    const template = TemplateMessage.create({
      metaTemplateId: '123',
      name: 'pedido_confirmado',
      language: 'pt_BR',
      parameters: [{ component: 'body', values: ['Maycon', '12345'] }],
    });
    if (template.isFailure) throw new Error('Invalid test fixture.');

    const payload = MetaMessageMapper.toSendMessageRequest({
      phoneNumberId: 'meta-phone-id',
      credentialSource: WhatsAppCredentialSource.TENANT,
      accessToken: 'token',
      to: '+5511999999999',
      content: 'Template: pedido_confirmado',
      template: template.value,
    });

    expect(payload).toEqual({
      messaging_product: 'whatsapp',
      to: '5511999999999',
      type: 'template',
      template: {
        name: 'pedido_confirmado',
        language: { code: 'pt_BR' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: 'Maycon' },
              { type: 'text', text: '12345' },
            ],
          },
        ],
      },
    });
  });

  it('preserva um BSUID ao montar o payload da Meta', () => {
    const payload = MetaMessageMapper.toSendMessageRequest({
      phoneNumberId: 'meta-phone-id',
      credentialSource: WhatsAppCredentialSource.TENANT,
      accessToken: 'token',
      to: 'BR.13491208655302741918',
      content: 'Olá!',
      template: null,
    });

    expect(payload.to).toBe('BR.13491208655302741918');
  });

  it('repete o OTP no BODY e no botão de copiar código do template de autenticação', () => {
    const template = TemplateMessage.create({
      metaTemplateId: 'otp-1',
      name: 'folhabox_codigo_acesso',
      language: 'pt_BR',
      parameters: [
        { component: 'body', values: ['391827'] },
        { component: 'button', index: 0, action: 'url', values: ['391827'] },
      ],
      sensitive: true,
    });
    if (template.isFailure) throw new Error('Invalid test fixture.');

    const payload = MetaMessageMapper.toSendMessageRequest({
      phoneNumberId: 'meta-phone-id',
      credentialSource: WhatsAppCredentialSource.TENANT,
      accessToken: 'token',
      to: '+5511999999999',
      content: 'Template: folhabox_codigo_acesso',
      template: template.value,
    });

    expect(payload).toMatchObject({
      template: {
        components: [
          { type: 'body', parameters: [{ type: 'text', text: '391827' }] },
          {
            type: 'button',
            sub_type: 'url',
            index: 0,
            parameters: [{ type: 'text', text: '391827' }],
          },
        ],
      },
    });
  });
});
