import { Inject, Injectable } from '@nestjs/common';
import { SmtpConfigService } from '@infrastructure/configuration/smtp-config.service';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { SmtpConfigurationNotFoundError } from '../../domain/errors/smtp-configuration-not-found.error';
import {
  EMAIL_SMTP_CONFIGURATION_REPOSITORY,
  IEmailSmtpConfigurationRepository,
} from '../../domain/repositories/email-smtp-configuration.repository.interface';
import {
  ISmtpConfigurationResolver,
  ResolvedSmtpConfiguration,
} from '../ports/smtp-configuration-resolver.interface';

@Injectable()
export class SmtpConfigurationResolverService implements ISmtpConfigurationResolver {
  constructor(
    @Inject(EMAIL_SMTP_CONFIGURATION_REPOSITORY)
    private readonly configurations: IEmailSmtpConfigurationRepository,
    private readonly defaultSmtp: SmtpConfigService,
  ) {}

  async resolve(
    tenantId: UniqueId,
  ): Promise<Result<ResolvedSmtpConfiguration, SmtpConfigurationNotFoundError>> {
    const tenantConfiguration = await this.configurations.findByTenantId(tenantId);
    if (tenantConfiguration) {
      return Result.ok({
        source: 'tenant',
        settings: {
          host: tenantConfiguration.host,
          port: tenantConfiguration.port,
          secure: tenantConfiguration.secure,
          username: tenantConfiguration.username,
          password: tenantConfiguration.password,
          fromEmail: tenantConfiguration.fromEmail,
          fromName: tenantConfiguration.fromName,
        },
      });
    }
    const defaultSettings = this.defaultSmtp.defaultSettings;
    return defaultSettings
      ? Result.ok({ source: 'default', settings: defaultSettings })
      : Result.fail(new SmtpConfigurationNotFoundError());
  }
}
