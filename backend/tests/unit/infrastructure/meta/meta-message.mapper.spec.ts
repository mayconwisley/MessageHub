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
      to: '+5511999999999',
      type: 'template',
      template: {
        name: 'pedido_confirmado',
        language: { code: 'pt_BR' },
        components: [{
          type: 'body',
          parameters: [{ type: 'text', text: 'Maycon' }, { type: 'text', text: '12345' }],
        }],
      },
    });
  });
});
