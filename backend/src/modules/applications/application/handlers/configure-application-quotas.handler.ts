import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { ApplicationNotFoundError } from '../../domain/errors/application-not-found.error';
import {
  APPLICATION_REPOSITORY,
  IApplicationRepository,
} from '../../domain/repositories/application.repository.interface';
import { ConfigureApplicationQuotasCommand } from '../commands/configure-application-quotas.command';
import { ApplicationDto } from '../dto/application.dto';
import { ApplicationMapper } from '../mappers/application.mapper';

@CommandHandler(ConfigureApplicationQuotasCommand)
export class ConfigureApplicationQuotasHandler implements ICommandHandler<ConfigureApplicationQuotasCommand> {
  constructor(
    @Inject(APPLICATION_REPOSITORY) private readonly applications: IApplicationRepository,
  ) {}
  async execute(
    command: ConfigureApplicationQuotasCommand,
  ): Promise<Result<ApplicationDto, ApplicationNotFoundError>> {
    const application = await this.applications.findById(UniqueId.create(command.applicationId));
    if (!application) return Result.fail(new ApplicationNotFoundError(command.applicationId));
    application.configureQuotas(command.quotaPerMinute, command.quotaPerDay);
    await this.applications.save(application);
    return Result.ok(ApplicationMapper.toDto(application));
  }
}
