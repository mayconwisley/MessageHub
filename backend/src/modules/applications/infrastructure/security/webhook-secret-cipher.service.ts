import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { Injectable } from '@nestjs/common';
import { MetaConfigService } from '@infrastructure/configuration/meta-config.service';

const ALGORITHM = 'aes-256-gcm';
const INITIALIZATION_VECTOR_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const ENCRYPTED_VALUE_VERSION = 'v1';

/** Protege o segredo HMAC de callbacks de aplicações em repouso. */
@Injectable()
export class WebhookSecretCipherService {
  constructor(private readonly metaConfig: MetaConfigService) {}

  encrypt(plainText: string): string {
    const initializationVector = randomBytes(INITIALIZATION_VECTOR_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.encryptionKey, initializationVector, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
    return [
      ENCRYPTED_VALUE_VERSION,
      initializationVector.toString('base64url'),
      cipher.getAuthTag().toString('base64url'),
      encrypted.toString('base64url'),
    ].join('.');
  }

  decrypt(value: string): string {
    // Compatibilidade com registros criados antes da criptografia em repouso.
    // A próxima gravação da Application os substitui pelo formato cifrado v1.
    if (!value.startsWith(`${ENCRYPTED_VALUE_VERSION}.`)) return value;
    const [version, initializationVectorValue, authTagValue, cipherTextValue] = value.split('.');
    if (
      version !== ENCRYPTED_VALUE_VERSION ||
      !initializationVectorValue ||
      !authTagValue ||
      !cipherTextValue
    ) {
      throw new Error('Invalid encrypted webhook secret format.');
    }
    const decipher = createDecipheriv(
      ALGORITHM,
      this.encryptionKey,
      Buffer.from(initializationVectorValue, 'base64url'),
      { authTagLength: AUTH_TAG_LENGTH },
    );
    decipher.setAuthTag(Buffer.from(authTagValue, 'base64url'));
    return Buffer.concat([
      decipher.update(Buffer.from(cipherTextValue, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  }

  private get encryptionKey(): Buffer {
    const key = Buffer.from(this.metaConfig.credentialsEncryptionKey, 'base64');
    if (key.length !== 32) {
      throw new Error('META_CREDENTIALS_ENCRYPTION_KEY must be a Base64-encoded 32-byte key.');
    }
    return key;
  }
}
