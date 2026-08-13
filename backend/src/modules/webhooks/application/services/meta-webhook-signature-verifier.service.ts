import { Inject, Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { MetaConfigService } from '@infrastructure/configuration/meta-config.service';
import {
  IPhoneNumberRepository,
  PHONE_NUMBER_REPOSITORY,
} from '@modules/phone-numbers/domain/repositories/phone-number.repository.interface';
import {
  IWhatsAppAccountRepository,
  WHATSAPP_ACCOUNT_REPOSITORY,
} from '@modules/whatsapp-accounts/domain/repositories/whatsapp-account.repository.interface';
import { MetaWebhookPayload } from '../dto/meta-webhook-payload.dto';

const SIGNATURE_PREFIX = 'sha256=';

/** Valida a assinatura HMAC do webhook contra o app secret global e, quando aplicável, o da conta WhatsApp do tenant. */
@Injectable()
export class MetaWebhookSignatureVerifierService {
  constructor(
    private readonly config: MetaConfigService,
    @Inject(PHONE_NUMBER_REPOSITORY) private readonly phoneNumbers: IPhoneNumberRepository,
    @Inject(WHATSAPP_ACCOUNT_REPOSITORY) private readonly accounts: IWhatsAppAccountRepository,
  ) {}

  async verify(
    rawBody: Buffer | undefined,
    signatureHeader: string | undefined,
    payload: MetaWebhookPayload,
  ): Promise<boolean> {
    if (!signatureHeader?.startsWith(SIGNATURE_PREFIX) || !rawBody) return false;
    const receivedBytes = Buffer.from(signatureHeader.slice(SIGNATURE_PREFIX.length), 'hex');
    const candidates = await this.resolveAppSecrets(payload);
    return candidates.some((secret) => this.signatureMatches(rawBody, secret, receivedBytes));
  }

  private async resolveAppSecrets(payload: MetaWebhookPayload): Promise<string[]> {
    const secrets = new Set<string>();
    if (this.config.appSecret) secrets.add(this.config.appSecret);
    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const providerPhoneId = change.value?.metadata?.phone_number_id;
        if (!providerPhoneId) continue;
        const phone = await this.phoneNumbers.findByProviderPhoneNumberId(providerPhoneId);
        const account = phone ? await this.accounts.findById(phone.whatsAppAccountId) : null;
        if (account?.appSecret) secrets.add(account.appSecret);
      }
    }
    return [...secrets];
  }

  private signatureMatches(body: Buffer, secret: string, received: Buffer): boolean {
    const expected = Buffer.from(createHmac('sha256', secret).update(body).digest('hex'), 'hex');
    return expected.length === received.length && timingSafeEqual(expected, received);
  }
}
