import { Injectable } from '@nestjs/common';
import { MetaConfigService } from '@infrastructure/configuration/meta-config.service';
import {
  EncryptionKeyMaterial,
  RotatingAesGcmCipher,
} from '@infrastructure/security/rotating-aes-gcm-cipher';

/** Protege o segredo HMAC de callbacks de aplicações em repouso. */
@Injectable()
export class WebhookSecretCipherService {
  constructor(private readonly metaConfig: MetaConfigService) {}

  encrypt(plainText: string): string {
    return this.cipher.encrypt(plainText);
  }

  decrypt(value: string): string {
    // Compatibilidade com registros criados antes da criptografia em repouso.
    // A próxima gravação da Application os substitui pelo formato cifrado v1.
    if (!value.startsWith('v1.') && !value.startsWith('v2.')) return value;
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
