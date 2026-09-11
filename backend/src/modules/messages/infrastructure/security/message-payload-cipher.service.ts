import { Injectable } from '@nestjs/common';
import { MetaConfigService } from '@infrastructure/configuration/meta-config.service';
import {
  EncryptionKeyMaterial,
  RotatingAesGcmCipher,
} from '@infrastructure/security/rotating-aes-gcm-cipher';

/** Protege parâmetros sensíveis necessários ao processamento assíncrono, como códigos OTP. */
@Injectable()
export class MessagePayloadCipherService {
  constructor(private readonly metaConfig: MetaConfigService) {}

  encrypt(plainText: string): string {
    return this.cipher.encrypt(plainText);
  }

  decrypt(encryptedValue: string): string {
    return this.cipher.decrypt(encryptedValue);
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
