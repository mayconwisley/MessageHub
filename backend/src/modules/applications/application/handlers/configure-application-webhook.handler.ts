import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { ApplicationNotFoundError } from '../../domain/errors/application-not-found.error';
import {
  APPLICATION_REPOSITORY,
  IApplicationRepository,
} from '../../domain/repositories/application.repository.interface';
import { ConfigureApplicationWebhookCommand } from '../commands/configure-application-webhook.command';
import { ApplicationDto } from '../dto/application.dto';
import { ApplicationMapper } from '../mappers/application.mapper';

@CommandHandler(ConfigureApplicationWebhookCommand)
export class ConfigureApplicationWebhookHandler
  implements ICommandHandler<ConfigureApplicationWebhookCommand>
{
  constructor(
    @Inject(APPLICATION_REPOSITORY) private readonly applications: IApplicationRepository,
  ) {}

  async execute(
    command: ConfigureApplicationWebhookCommand,
  ): Promise<Result<ApplicationDto, ApplicationNotFoundError>> {
    const application = await this.applications.findById(UniqueId.create(command.applicationId));
    if (!application) {
      return Result.fail(new ApplicationNotFoundError(command.applicationId));
    }

    application.configureWebhook(command.webhookUrl);
    await this.applications.save(application);

    return Result.ok(ApplicationMapper.toDto(application));
  }
}
