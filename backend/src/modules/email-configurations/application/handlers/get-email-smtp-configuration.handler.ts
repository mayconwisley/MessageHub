import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { SmtpConfigService } from '@infrastructure/configuration/smtp-config.service';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import {
  EMAIL_SMTP_CONFIGURATION_REPOSITORY,
  IEmailSmtpConfigurationRepository,
} from '../../domain/repositories/email-smtp-configuration.repository.interface';
import { EmailSmtpConfigurationDto } from '../dto/email-smtp-configuration.dto';
import { EmailSmtpConfigurationMapper } from '../mappers/email-smtp-configuration.mapper';
import { GetEmailSmtpConfigurationQuery } from '../queries/get-email-smtp-configuration.query';

@QueryHandler(GetEmailSmtpConfigurationQuery)
export class GetEmailSmtpConfigurationHandler implements IQueryHandler<GetEmailSmtpConfigurationQuery> {
  constructor(
    @Inject(EMAIL_SMTP_CONFIGURATION_REPOSITORY)
    private readonly configurations: IEmailSmtpConfigurationRepository,
    private readonly defaultSmtp: SmtpConfigService,
  ) {}

  async execute(query: GetEmailSmtpConfigurationQuery): Promise<Result<EmailSmtpConfigurationDto>> {
    const tenant = await this.configurations.findByTenantId(UniqueId.create(query.tenantId));
    if (tenant) return Result.ok(EmailSmtpConfigurationMapper.toDto(tenant));
    const fallback = this.defaultSmtp.defaultSettings;
    return Result.ok(
      fallback
        ? {
            id: null,
            source: 'default',
            host: null,
            port: null,
            secure: null,
            username: null,
            fromEmail: fallback.fromEmail,
            fromName: fallback.fromName,
            createdAt: null,
            updatedAt: null,
          }
        : {
            id: null,
            source: 'none',
            host: null,
            port: null,
            secure: null,
            username: null,
            fromEmail: null,
            fromName: null,
            createdAt: null,
            updatedAt: null,
          },
    );
  }
}
