import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { Injectable } from '@nestjs/common';
import { MetaConfigService } from '@infrastructure/configuration/meta-config.service';

const ALGORITHM = 'aes-256-gcm';
const INITIALIZATION_VECTOR_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const ENCRYPTED_VALUE_VERSION = 'v1';

/** Cifra senhas SMTP de tenants com AES-256-GCM antes da persistência. */
@Injectable()
export class SmtpPasswordCipherService {
  constructor(private readonly metaConfig: MetaConfigService) {}

  encrypt(plainText: string): string {
    const iv = randomBytes(INITIALIZATION_VECTOR_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.encryptionKey, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
    return [
      ENCRYPTED_VALUE_VERSION,
      iv.toString('base64url'),
      cipher.getAuthTag().toString('base64url'),
      encrypted.toString('base64url'),
    ].join('.');
  }

  decrypt(value: string): string {
    const [version, ivValue, authTagValue, cipherTextValue] = value.split('.');
    if (version !== ENCRYPTED_VALUE_VERSION || !ivValue || !authTagValue || !cipherTextValue)
      throw new Error('Invalid encrypted SMTP password format.');
    const decipher = createDecipheriv(
      ALGORITHM,
      this.encryptionKey,
      Buffer.from(ivValue, 'base64url'),
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
    if (key.length !== 32)
      throw new Error('META_CREDENTIALS_ENCRYPTION_KEY must be a Base64-encoded 32-byte key.');
    return key;
  }
}
