import { Inject, Injectable } from '@nestjs/common';
import {
  IPhoneNumberRepository,
  PHONE_NUMBER_REPOSITORY,
} from '@modules/phone-numbers/domain/repositories/phone-number.repository.interface';
import {
  IWhatsAppAccountRepository,
  WHATSAPP_ACCOUNT_REPOSITORY,
} from '@modules/whatsapp-accounts/domain/repositories/whatsapp-account.repository.interface';

interface MetaWebhookChange {
  value?: { metadata?: { phone_number_id?: string } };
}

interface MetaWebhookPayload {
  entry?: { changes?: MetaWebhookChange[] }[];
}

/** Resolve o tenant somente quando todo o evento pertence inequivocamente a um único tenant. */
@Injectable()
export class MetaWebhookTenantResolverService {
  constructor(
    @Inject(PHONE_NUMBER_REPOSITORY) private readonly phoneNumbers: IPhoneNumberRepository,
    @Inject(WHATSAPP_ACCOUNT_REPOSITORY)
    private readonly whatsAppAccounts: IWhatsAppAccountRepository,
  ) {}

  async resolve(payload: Record<string, unknown>): Promise<string | null> {
    const webhook = payload as MetaWebhookPayload;
    const phoneNumberIds = new Set<string>();
    for (const entry of webhook.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const phoneNumberId = change.value?.metadata?.phone_number_id;
        if (phoneNumberId) phoneNumberIds.add(phoneNumberId);
      }
    }

    if (phoneNumberIds.size !== 1) return null;
    const providerPhoneNumberId = phoneNumberIds.values().next().value;
    if (!providerPhoneNumberId) return null;

    const phoneNumber = await this.phoneNumbers.findByProviderPhoneNumberId(providerPhoneNumberId);
    if (!phoneNumber) return null;
    const account = await this.whatsAppAccounts.findById(phoneNumber.whatsAppAccountId);
    return account?.tenantId.value ?? null;
  }
}
