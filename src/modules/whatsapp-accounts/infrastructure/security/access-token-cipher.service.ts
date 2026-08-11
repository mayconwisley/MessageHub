import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { Injectable } from '@nestjs/common';
import { MetaConfigService } from '@infrastructure/configuration/meta-config.service';

const ALGORITHM = 'aes-256-gcm';
const INITIALIZATION_VECTOR_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const ENCRYPTED_TOKEN_VERSION = 'v1';

/** Protege tokens de tenants em repouso. A chave permanece exclusivamente no ambiente da aplicação. */
@Injectable()
export class AccessTokenCipherService {
  constructor(private readonly metaConfig: MetaConfigService) {}

  encrypt(plainText: string): string {
    const initializationVector = randomBytes(INITIALIZATION_VECTOR_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.encryptionKey, initializationVector, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return [
      ENCRYPTED_TOKEN_VERSION,
      initializationVector.toString('base64url'),
      authTag.toString('base64url'),
      encrypted.toString('base64url'),
    ].join('.');
  }

  decrypt(encryptedValue: string): string {
    const [version, initializationVectorValue, authTagValue, cipherTextValue] =
      encryptedValue.split('.');
    if (
      version !== ENCRYPTED_TOKEN_VERSION ||
      !initializationVectorValue ||
      !authTagValue ||
      !cipherTextValue
    ) {
      throw new Error('Invalid encrypted tenant access token format.');
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
