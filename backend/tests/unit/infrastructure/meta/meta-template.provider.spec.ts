import { MetaConfigService } from '@infrastructure/configuration/meta-config.service';
import { MetaWhatsAppClient } from '@infrastructure/meta/clients/meta-whatsapp.client';
import { MetaTemplateProvider } from '@infrastructure/meta/services/meta-template.provider';
import { WhatsAppAccount } from '@modules/whatsapp-accounts/domain/entities/whatsapp-account.entity';
import { WhatsAppCredentialSource } from '@modules/whatsapp-accounts/domain/enums/whatsapp-credential-source.enum';
import { UniqueId } from '@shared/domain';

describe('MetaTemplateProvider', () => {
  it('mapeia os campos específicos do template OTP para o contrato da Meta', async () => {
    const createTemplate = jest.fn().mockResolvedValue({ id: 'meta-otp-1', status: 'PENDING' });
    const provider = new MetaTemplateProvider(
      { createTemplate } as unknown as MetaWhatsAppClient,
      { defaultChannelEnabled: false } as MetaConfigService,
    );
    const accountResult = WhatsAppAccount.create({
      tenantId: UniqueId.create(),
      wabaId: 'waba-1',
      credentialSource: WhatsAppCredentialSource.TENANT,
      accessToken: 'token-1',
    });
    if (accountResult.isFailure) throw new Error('Invalid test fixture.');

    const result = await provider.create(accountResult.value, {
      name: 'folhabox_codigo_acesso',
      language: 'pt_BR',
      category: 'AUTHENTICATION',
      components: [
        { type: 'BODY', addSecurityRecommendation: true },
        { type: 'FOOTER', codeExpirationMinutes: 5 },
        {
          type: 'BUTTONS',
          buttons: [{ type: 'OTP', otp_type: 'COPY_CODE', text: 'Copiar código' }],
        },
      ],
    });

    expect(result.isSuccess).toBe(true);
    expect(createTemplate).toHaveBeenCalledWith(
      { wabaId: 'waba-1', accessToken: 'token-1' },
      expect.objectContaining({
        components: [
          { type: 'BODY', add_security_recommendation: true },
          { type: 'FOOTER', code_expiration_minutes: 5 },
          {
            type: 'BUTTONS',
            buttons: [{ type: 'OTP', otp_type: 'COPY_CODE', text: 'Copiar código' }],
          },
        ],
      }),
    );
  });
});
