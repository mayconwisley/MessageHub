import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { EmailSmtpConfiguration } from '../../domain/entities/email-smtp-configuration.entity';
import { InvalidSmtpConfigurationError } from '../../domain/errors/invalid-smtp-configuration.error';
import {
  EMAIL_SMTP_CONFIGURATION_REPOSITORY,
  IEmailSmtpConfigurationRepository,
} from '../../domain/repositories/email-smtp-configuration.repository.interface';
import { ConfigureEmailSmtpCommand } from '../commands/configure-email-smtp.command';
import { EmailSmtpConfigurationDto } from '../dto/email-smtp-configuration.dto';
import { EmailSmtpConfigurationMapper } from '../mappers/email-smtp-configuration.mapper';

@CommandHandler(ConfigureEmailSmtpCommand)
export class ConfigureEmailSmtpHandler implements ICommandHandler<ConfigureEmailSmtpCommand> {
  constructor(
    @Inject(EMAIL_SMTP_CONFIGURATION_REPOSITORY)
    private readonly configurations: IEmailSmtpConfigurationRepository,
  ) {}

  async execute(
    command: ConfigureEmailSmtpCommand,
  ): Promise<Result<EmailSmtpConfigurationDto, InvalidSmtpConfigurationError>> {
    const tenantId = UniqueId.create(command.tenantId);
    const existing = await this.configurations.findByTenantId(tenantId);
    if (existing) {
      const result = existing.update({
        host: command.host,
        port: command.port,
        secure: command.secure,
        username: command.username,
        password: command.password,
        fromEmail: command.fromEmail,
        fromName: command.fromName,
      });
      if (result.isFailure) return Result.fail(result.error);
      await this.configurations.save(existing);
      return Result.ok(EmailSmtpConfigurationMapper.toDto(existing));
    }
    const result = EmailSmtpConfiguration.create({
      tenantId,
      host: command.host,
      port: command.port,
      secure: command.secure,
      username: command.username,
      password: command.password,
      fromEmail: command.fromEmail,
      fromName: command.fromName,
    });
    if (result.isFailure) return Result.fail(result.error);
    await this.configurations.save(result.value);
    return Result.ok(EmailSmtpConfigurationMapper.toDto(result.value));
  }
}
