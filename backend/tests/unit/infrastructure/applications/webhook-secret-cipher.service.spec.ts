import { randomBytes } from 'crypto';
import { MetaConfigService } from '@infrastructure/configuration/meta-config.service';
import { WebhookSecretCipherService } from '@modules/applications/infrastructure/security/webhook-secret-cipher.service';

function buildCipher(encryptionKeyBase64: string): WebhookSecretCipherService {
  const metaConfig = {
    credentialsEncryptionKey: encryptionKeyBase64,
  } as unknown as MetaConfigService;
  return new WebhookSecretCipherService(metaConfig);
}

describe('WebhookSecretCipherService', () => {
  const key = randomBytes(32).toString('base64');

  it('cifra o segredo e recupera o valor original', () => {
    const cipher = buildCipher(key);

    const encrypted = cipher.encrypt('webhook-secret');

    expect(encrypted).not.toContain('webhook-secret');
    expect(cipher.decrypt(encrypted)).toBe('webhook-secret');
  });

  it('gera envelopes diferentes para o mesmo segredo', () => {
    const cipher = buildCipher(key);

    expect(cipher.encrypt('webhook-secret')).not.toBe(cipher.encrypt('webhook-secret'));
  });

  it('preserva registros legados em texto puro para migração transparente', () => {
    const cipher = buildCipher(key);

    expect(cipher.decrypt('legacy-webhook-secret')).toBe('legacy-webhook-secret');
  });

  it('rejeita segredo cifrado adulterado', () => {
    const cipher = buildCipher(key);
    const encrypted = cipher.encrypt('webhook-secret');
    const parts = encrypted.split('.');
    const authTagIndex = 3;
    const authTag = parts[authTagIndex];
    parts[authTagIndex] = (authTag.at(0) === 'A' ? 'B' : 'A') + authTag.slice(1);

    expect(() => cipher.decrypt(parts.join('.'))).toThrow();
  });
});
