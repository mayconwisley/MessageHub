import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import {
  EMAIL_SMTP_CONFIGURATION_REPOSITORY,
  IEmailSmtpConfigurationRepository,
} from '../../domain/repositories/email-smtp-configuration.repository.interface';
import { RemoveEmailSmtpCommand } from '../commands/remove-email-smtp.command';

@CommandHandler(RemoveEmailSmtpCommand)
export class RemoveEmailSmtpHandler implements ICommandHandler<RemoveEmailSmtpCommand> {
  constructor(
    @Inject(EMAIL_SMTP_CONFIGURATION_REPOSITORY)
    private readonly configurations: IEmailSmtpConfigurationRepository,
  ) {}

  async execute(command: RemoveEmailSmtpCommand): Promise<Result<void>> {
    const configuration = await this.configurations.findByTenantId(
      UniqueId.create(command.tenantId),
    );
    if (configuration) await this.configurations.delete(configuration);
    return Result.ok(undefined);
  }
}
