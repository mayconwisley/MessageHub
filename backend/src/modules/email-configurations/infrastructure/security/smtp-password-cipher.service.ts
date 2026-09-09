import { Injectable } from '@nestjs/common';
import { MetaConfigService } from '@infrastructure/configuration/meta-config.service';
import {
  EncryptionKeyMaterial,
  RotatingAesGcmCipher,
} from '@infrastructure/security/rotating-aes-gcm-cipher';

/** Cifra senhas SMTP de tenants com AES-256-GCM antes da persistência. */
@Injectable()
export class SmtpPasswordCipherService {
  constructor(private readonly metaConfig: MetaConfigService) {}

  encrypt(plainText: string): string {
    return this.cipher.encrypt(plainText);
  }

  decrypt(value: string): string {
    return this.cipher.decrypt(value);
  }

  private get cipher(): RotatingAesGcmCipher {
    return new RotatingAesGcmCipher(this.keys);
  }
  private get keys(): EncryptionKeyMaterial[] {
    const keyring = this.metaConfig.credentialsEncryptionKeyring;
    if (!keyring) return [{ id: 'primary', value: this.metaConfig.credentialsEncryptionKey }];
    return keyring.split(',').map((item) => {
      const [id, value] = item.trim().split(':');
      return { id: id ?? '', value: value ?? '' };
    });
  }
}
