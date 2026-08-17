import { randomBytes } from 'crypto';
import { MetaConfigService } from '@infrastructure/configuration/meta-config.service';
import { SmtpPasswordCipherService } from '@modules/email-configurations/infrastructure/security/smtp-password-cipher.service';

function buildCipher(encryptionKeyBase64: string): SmtpPasswordCipherService {
  const metaConfig = {
    credentialsEncryptionKey: encryptionKeyBase64,
  } as unknown as MetaConfigService;
  return new SmtpPasswordCipherService(metaConfig);
}

describe('SmtpPasswordCipherService', () => {
  const key = randomBytes(32).toString('base64');
  const otherKey = randomBytes(32).toString('base64');

  it('round-trips a plaintext password through encrypt/decrypt', () => {
    const cipher = buildCipher(key);

    const encrypted = cipher.encrypt('super-secret-password');

    expect(cipher.decrypt(encrypted)).toBe('super-secret-password');
  });

  it('never produces ciphertext equal to the plaintext', () => {
    const cipher = buildCipher(key);

    const encrypted = cipher.encrypt('super-secret-password');

    expect(encrypted).not.toBe('super-secret-password');
    expect(encrypted).not.toContain('super-secret-password');
  });

  it('produces a versioned envelope of iv, authTag and ciphertext joined by dots', () => {
    const cipher = buildCipher(key);

    const encrypted = cipher.encrypt('super-secret-password');
    const parts = encrypted.split('.');

    expect(parts).toHaveLength(4);
    expect(parts[0]).toBe('v1');
  });

  it('produces different ciphertext for the same plaintext on each call (random IV)', () => {
    const cipher = buildCipher(key);

    const first = cipher.encrypt('super-secret-password');
    const second = cipher.encrypt('super-secret-password');

    expect(first).not.toBe(second);
  });

  it('throws when decrypting with the wrong key', () => {
    const encrypted = buildCipher(key).encrypt('super-secret-password');

    expect(() => buildCipher(otherKey).decrypt(encrypted)).toThrow();
  });

  it('throws when decrypting a tampered ciphertext', () => {
    const encrypted = buildCipher(key).encrypt('super-secret-password');
    const [version, iv, authTag, cipherText] = encrypted.split('.');
    const tamperedCipherText =
      cipherText.slice(0, -1) + (cipherText.at(-1) === 'A' ? 'B' : 'A');
    const tampered = [version, iv, authTag, tamperedCipherText].join('.');

    expect(() => buildCipher(key).decrypt(tampered)).toThrow();
  });

  it('throws when the encrypted value has an invalid format', () => {
    const cipher = buildCipher(key);

    expect(() => cipher.decrypt('not-a-valid-envelope')).toThrow(
      'Invalid encrypted SMTP password format.',
    );
  });

  it('throws when the configured encryption key is not a 32-byte value', () => {
    const cipher = buildCipher(Buffer.from('too-short').toString('base64'));

    expect(() => cipher.encrypt('anything')).toThrow(
      'META_CREDENTIALS_ENCRYPTION_KEY must be a Base64-encoded 32-byte key.',
    );
  });
});
