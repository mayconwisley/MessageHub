import { Inject, Injectable, Logger } from '@nestjs/common';
import { v5 as uuidv5 } from 'uuid';
import { MetaConfigService } from '@infrastructure/configuration/meta-config.service';
import { UniqueId } from '@shared/domain';
import { Application } from '@modules/applications/domain/entities/application.entity';
import {
  APPLICATION_PHONE_NUMBER_LINK_REPOSITORY,
  IApplicationPhoneNumberLinkRepository,
} from '@modules/applications/domain/repositories/application-phone-number-link.repository.interface';
import {
  APPLICATION_REPOSITORY,
  IApplicationRepository,
} from '@modules/applications/domain/repositories/application.repository.interface';
import { PhoneNumber } from '@modules/phone-numbers/domain/entities/phone-number.entity';
import {
  IPhoneNumberRepository,
  PHONE_NUMBER_REPOSITORY,
} from '@modules/phone-numbers/domain/repositories/phone-number.repository.interface';
import { Tenant } from '@modules/tenants/domain/entities/tenant.entity';
import {
  ITenantRepository,
  TENANT_REPOSITORY,
} from '@modules/tenants/domain/repositories/tenant.repository.interface';
import { WhatsAppAccount } from '../../domain/entities/whatsapp-account.entity';
import { WhatsAppCredentialSource } from '../../domain/enums/whatsapp-credential-source.enum';
import {
  IWhatsAppAccountRepository,
  WHATSAPP_ACCOUNT_REPOSITORY,
} from '../../domain/repositories/whatsapp-account.repository.interface';

const DEFAULT_CHANNEL_NAMESPACE = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';

/** Mantém o cadastro técnico do canal padrão alinhado ao .env a cada inicialização. */
@Injectable()
export class DefaultChannelSeedService {
  private readonly logger = new Logger(DefaultChannelSeedService.name);

  constructor(
    @Inject(TENANT_REPOSITORY) private readonly tenants: ITenantRepository,
    @Inject(WHATSAPP_ACCOUNT_REPOSITORY) private readonly accounts: IWhatsAppAccountRepository,
    @Inject(APPLICATION_REPOSITORY) private readonly applications: IApplicationRepository,
    @Inject(PHONE_NUMBER_REPOSITORY) private readonly phoneNumbers: IPhoneNumberRepository,
    @Inject(APPLICATION_PHONE_NUMBER_LINK_REPOSITORY)
    private readonly applicationPhoneNumbers: IApplicationPhoneNumberLinkRepository,
    private readonly metaConfig: MetaConfigService,
  ) {}

  async synchronize(): Promise<void> {
    if (!this.metaConfig.defaultChannelEnabled) return;

    const tenantId = UniqueId.create(this.metaConfig.defaultTenantId as string);
    const tenantName = this.metaConfig.defaultTenantName as string;
    const wabaId = this.metaConfig.defaultWabaId as string;

    let tenant = await this.tenants.findById(tenantId);
    if (!tenant) {
      const created = Tenant.create({ name: tenantName }, tenantId);
      if (created.isFailure) throw created.error;
      tenant = created.value;
      await this.tenants.save(tenant);
    } else {
      tenant.synchronizeFromDefaultChannel(tenantName);
      await this.tenants.save(tenant);
    }

    let account = await this.accounts.findByTenantAndWabaId(tenantId, wabaId);
    if (!account) {
      const existingAccounts = await this.accounts.listByTenantId(tenantId, 1, 100);
      account =
        existingAccounts.items.find(
          (item) => item.credentialSource === WhatsAppCredentialSource.DEFAULT,
        ) ?? null;
    }

    if (!account) {
      const created = WhatsAppAccount.create({
        tenantId,
        wabaId,
        credentialSource: WhatsAppCredentialSource.DEFAULT,
      });
      if (created.isFailure) throw created.error;
      account = created.value;
    } else {
      const synchronized = account.synchronizeFromDefaultChannel(wabaId);
      if (synchronized.isFailure) throw synchronized.error;
    }
    await this.accounts.save(account);

    const applicationId = UniqueId.create(
      uuidv5('default-channel-application', DEFAULT_CHANNEL_NAMESPACE),
    );
    let application = await this.applications.findById(applicationId);
    if (!application) {
      const created = Application.create(
        { tenantId, name: this.metaConfig.defaultApplicationName },
        applicationId,
      );
      if (created.isFailure) throw created.error;
      application = created.value;
    } else {
      application.synchronizeFromDefaultChannel(this.metaConfig.defaultApplicationName);
    }
    await this.applications.save(application);

    const providerPhoneNumberId = this.metaConfig.defaultPhoneNumberId;
    const displayPhoneNumber = this.metaConfig.defaultPhoneNumber;
    if (providerPhoneNumberId && displayPhoneNumber) {
      const phoneNumberId = UniqueId.create(
        uuidv5('default-channel-phone-number', DEFAULT_CHANNEL_NAMESPACE),
      );
      let phoneNumber = await this.phoneNumbers.findById(phoneNumberId);
      if (!phoneNumber) {
        const created = PhoneNumber.create(
          {
            whatsAppAccountId: account.id,
            phoneNumberId: providerPhoneNumberId,
            displayNumber: displayPhoneNumber,
          },
          phoneNumberId,
        );
        if (created.isFailure) throw created.error;
        phoneNumber = created.value;
      } else {
        const synchronized = phoneNumber.synchronizeFromDefaultChannel(
          providerPhoneNumberId,
          displayPhoneNumber,
        );
        if (synchronized.isFailure) throw synchronized.error;
      }
      await this.phoneNumbers.save(phoneNumber);
      await this.applicationPhoneNumbers.replaceForApplication(application.id, [phoneNumber.id]);
    }

    this.logger.log(
      { tenantId: tenant.id.value, applicationId: application.id.value, wabaId },
      'Canal Meta padrão sincronizado a partir do ambiente',
    );
  }
}
