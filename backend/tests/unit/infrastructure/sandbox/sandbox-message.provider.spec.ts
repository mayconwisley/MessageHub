import { SandboxMessageProvider } from '@infrastructure/sandbox/services/sandbox-message.provider';
import { WhatsAppCredentialSource } from '@modules/whatsapp-accounts/domain/enums/whatsapp-credential-source.enum';

describe('SandboxMessageProvider', () => {
  const provider = new SandboxMessageProvider();
  const message = (to: string) => ({
    phoneNumberId: 'sandbox-phone',
    credentialSource: WhatsAppCredentialSource.TENANT,
    accessToken: null,
    to,
    content: 'teste',
    template: null,
  });

  it('gera identificador determinístico sem chamar a Meta', async () => {
    const first = await provider.send(message('+5511999999999'));
    const second = await provider.send(message('+5511999999999'));
    expect(first.isSuccess).toBe(true);
    expect(second.isSuccess).toBe(true);
    expect(first.value.providerMessageId).toBe(second.value.providerMessageId);
    expect(first.value.providerMessageId).toMatch(/^sandbox_/);
  });

  it('simula falha permanente e transitória por destinatário', async () => {
    const rejected = await provider.send(message('+551199990000'));
    const unavailable = await provider.send(message('+551199990001'));
    expect(rejected.isFailure).toBe(true);
    expect(rejected.error.retryable).toBe(false);
    expect(unavailable.isFailure).toBe(true);
    expect(unavailable.error.retryable).toBe(true);
  });
});
