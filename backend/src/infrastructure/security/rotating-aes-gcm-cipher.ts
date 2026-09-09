import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

export interface EncryptionKeyMaterial {
  id: string;
  value: string;
}

/** AES-GCM com keyring: novos valores identificam a chave; v1 permanece legível durante a rotação. */
export class RotatingAesGcmCipher {
  constructor(private readonly keys: EncryptionKeyMaterial[]) {
    if (keys.length === 0) throw new Error('At least one credentials encryption key is required.');
    for (const key of keys) {
      if (!/^[a-zA-Z0-9_-]+$/.test(key.id) || Buffer.from(key.value, 'base64').length !== 32) {
        throw new Error('Invalid credentials encryption keyring configuration.');
      }
    }
  }

  encrypt(plainText: string): string {
    const activeKey = this.keys[0];
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.toBuffer(activeKey), iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
    return [
      'v2',
      activeKey.id,
      iv.toString('base64url'),
      cipher.getAuthTag().toString('base64url'),
      encrypted.toString('base64url'),
    ].join('.');
  }

  decrypt(value: string): string {
    const parts = value.split('.');
    if (parts[0] === 'v2') {
      const [, keyId, iv, authTag, cipherText] = parts;
      const key = this.keys.find((candidate) => candidate.id === keyId);
      if (!key || !iv || !authTag || !cipherText || parts.length !== 5) {
        throw new Error('Invalid encrypted credentials format.');
      }
      return this.decryptWithKey(key, iv, authTag, cipherText);
    }
    if (parts[0] === 'v1') {
      const [, iv, authTag, cipherText] = parts;
      if (!iv || !authTag || !cipherText || parts.length !== 4) {
        throw new Error('Invalid legacy encrypted credentials format.');
      }
      for (const key of this.keys) {
        try {
          return this.decryptWithKey(key, iv, authTag, cipherText);
        } catch {
          // A chave anterior pode ter sido usada para registros v1 sem keyId.
        }
      }
      throw new Error('Unable to decrypt credentials with the configured keyring.');
    }
    throw new Error('Unsupported encrypted credentials version.');
  }

  private decryptWithKey(
    key: EncryptionKeyMaterial,
    iv: string,
    authTag: string,
    cipherText: string,
  ): string {
    const decipher = createDecipheriv(ALGORITHM, this.toBuffer(key), Buffer.from(iv, 'base64url'), {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(Buffer.from(authTag, 'base64url'));
    return Buffer.concat([
      decipher.update(Buffer.from(cipherText, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  }

  private toBuffer(key: EncryptionKeyMaterial): Buffer {
    return Buffer.from(key.value, 'base64');
  }
}
