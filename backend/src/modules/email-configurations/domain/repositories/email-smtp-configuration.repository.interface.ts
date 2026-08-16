import { UniqueId } from '@shared/domain';
import { EmailSmtpConfiguration } from '../entities/email-smtp-configuration.entity';

export interface IEmailSmtpConfigurationRepository {
  save(configuration: EmailSmtpConfiguration): Promise<void>;
  findByTenantId(tenantId: UniqueId): Promise<EmailSmtpConfiguration | null>;
  delete(configuration: EmailSmtpConfiguration): Promise<void>;
}

export const EMAIL_SMTP_CONFIGURATION_REPOSITORY = Symbol('EMAIL_SMTP_CONFIGURATION_REPOSITORY');
