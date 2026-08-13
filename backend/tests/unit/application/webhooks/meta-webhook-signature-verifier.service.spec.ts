import { createHmac } from 'crypto';
import { MetaWebhookSignatureVerifierService } from '@modules/webhooks/application/services/meta-webhook-signature-verifier.service';
import { MetaConfigService } from '@infrastructure/configuration/meta-config.service';
import { IPhoneNumberRepository } from '@modules/phone-numbers/domain/repositories/phone-number.repository.interface';
import { IWhatsAppAccountRepository } from '@modules/whatsapp-accounts/domain/repositories/whatsapp-account.repository.interface';
import { MetaWebhookPayload } from '@modules/webhooks/application/dto/meta-webhook-payload.dto';

function sign(secret: string, body: Buffer): string {
  return `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
}

const EMPTY_PAYLOAD: MetaWebhookPayload = { object: 'whatsapp_business_account', entry: [] };

describe('MetaWebhookSignatureVerifierService', () => {
  const findByProviderPhoneNumberId = jest.fn();
  const findAccountById = jest.fn();
  const phoneNumbers = { findByProviderPhoneNumberId } as unknown as IPhoneNumberRepository;
  const accounts = { findById: findAccountById } as unknown as IWhatsAppAccountRepository;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function createService(appSecret: string | null): MetaWebhookSignatureVerifierService {
    const config = { appSecret } as unknown as MetaConfigService;
    return new MetaWebhookSignatureVerifierService(config, phoneNumbers, accounts);
  }

  it('rejeita quando não há header de assinatura', async () => {
    const service = createService('global-secret');
    const body = Buffer.from('{}');

    await expect(service.verify(body, undefined, EMPTY_PAYLOAD)).resolves.toBe(false);
  });

  it('rejeita quando não há corpo bruto disponível', async () => {
    const service = createService('global-secret');

    await expect(service.verify(undefined, 'sha256=irrelevant', EMPTY_PAYLOAD)).resolves.toBe(
      false,
    );
  });

  it('aceita assinatura válida calculada com o secret global', async () => {
    const service = createService('global-secret');
    const body = Buffer.from(JSON.stringify({ hello: 'world' }));

    await expect(service.verify(body, sign('global-secret', body), EMPTY_PAYLOAD)).resolves.toBe(
      true,
    );
  });

  it('rejeita assinatura calculada com secret diferente', async () => {
    const service = createService('global-secret');
    const body = Buffer.from(JSON.stringify({ hello: 'world' }));

    await expect(service.verify(body, sign('wrong-secret', body), EMPTY_PAYLOAD)).resolves.toBe(
      false,
    );
  });

  it('rejeita assinatura de tamanho diferente sem lançar erro', async () => {
    const service = createService('global-secret');
    const body = Buffer.from('{}');

    await expect(service.verify(body, 'sha256=abcd', EMPTY_PAYLOAD)).resolves.toBe(false);
  });

  it('aceita assinatura calculada com o app secret específico da conta WhatsApp do tenant', async () => {
    const service = createService(null);
    const body = Buffer.from(JSON.stringify({ hello: 'world' }));
    const payload: MetaWebhookPayload = {
      object: 'whatsapp_business_account',
      entry: [
        { changes: [{ field: 'messages', value: { metadata: { phone_number_id: 'phone-1' } } }] },
      ],
    };
    findByProviderPhoneNumberId.mockResolvedValue({ whatsAppAccountId: 'account-1' });
    findAccountById.mockResolvedValue({ appSecret: 'account-secret' });

    await expect(service.verify(body, sign('account-secret', body), payload)).resolves.toBe(true);
    expect(findByProviderPhoneNumberId).toHaveBeenCalledWith('phone-1');
    expect(findAccountById).toHaveBeenCalledWith('account-1');
  });
});
