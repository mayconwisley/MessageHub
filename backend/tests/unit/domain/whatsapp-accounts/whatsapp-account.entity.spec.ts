import { UniqueId } from '@shared/domain';
import { WhatsAppAccount } from '@modules/whatsapp-accounts/domain/entities/whatsapp-account.entity';
import { WhatsAppCredentialSource } from '@modules/whatsapp-accounts/domain/enums/whatsapp-credential-source.enum';

describe('WhatsAppAccount', () => {
  const tenantId = UniqueId.create();

  it('allows the default credential source without a tenant token', () => {
    const result = WhatsAppAccount.create({
      tenantId,
      wabaId: 'waba-default',
      credentialSource: WhatsAppCredentialSource.DEFAULT,
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.credentialSource).toBe(WhatsAppCredentialSource.DEFAULT);
    expect(result.value.accessToken).toBeNull();
  });

  it('requires a token for tenant credentials', () => {
    const result = WhatsAppAccount.create({
      tenantId,
      wabaId: 'waba-tenant',
      credentialSource: WhatsAppCredentialSource.TENANT,
    });

    expect(result.isFailure).toBe(true);
    expect(result.error.code).toBe('INVALID_WHATSAPP_ACCOUNT');
  });

  it('rejects a token for the default credential source', () => {
    const result = WhatsAppAccount.create({
      tenantId,
      wabaId: 'waba-default',
      credentialSource: WhatsAppCredentialSource.DEFAULT,
      accessToken: 'must-not-be-used',
    });

    expect(result.isFailure).toBe(true);
    expect(result.error.code).toBe('INVALID_WHATSAPP_ACCOUNT');
  });

  it('keeps the optional webhook app secret isolated from the access token', () => {
    const result = WhatsAppAccount.create({
      tenantId,
      wabaId: 'waba-tenant',
      credentialSource: WhatsAppCredentialSource.TENANT,
      accessToken: 'tenant-token',
      appSecret: 'meta-app-secret',
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.appSecret).toBe('meta-app-secret');
  });
});
