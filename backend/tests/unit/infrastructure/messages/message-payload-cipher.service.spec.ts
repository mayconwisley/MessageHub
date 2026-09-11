import { MetaConfigService } from '@infrastructure/configuration/meta-config.service';
import { MessagePayloadCipherService } from '@modules/messages/infrastructure/security/message-payload-cipher.service';

describe('MessagePayloadCipherService', () => {
  it('cifra o OTP em repouso e recupera o payload para o worker', () => {
    const cipher = new MessagePayloadCipherService({
      credentialsEncryptionKey: Buffer.alloc(32, 7).toString('base64'),
      credentialsEncryptionKeyring: null,
    } as MetaConfigService);
    const plainText = JSON.stringify([{ component: 'body', values: ['391827'] }]);

    const encrypted = cipher.encrypt(plainText);

    expect(encrypted).not.toContain('391827');
    expect(cipher.decrypt(encrypted)).toBe(plainText);
  });
});
