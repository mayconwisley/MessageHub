import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { TenantNotFoundError } from '@modules/tenants/domain/errors';
import {
  ITenantRepository,
  TENANT_REPOSITORY,
} from '@modules/tenants/domain/repositories/tenant.repository.interface';
import { Application } from '../../domain/entities/application.entity';
import { InvalidApplicationNameError } from '../../domain/errors/invalid-application-name.error';
import {
  APPLICATION_REPOSITORY,
  IApplicationRepository,
} from '../../domain/repositories/application.repository.interface';
import { CreateApplicationCommand } from '../commands/create-application.command';
import { ApplicationDto } from '../dto/application.dto';
import { ApplicationMapper } from '../mappers/application.mapper';

@CommandHandler(CreateApplicationCommand)
export class CreateApplicationHandler implements ICommandHandler<CreateApplicationCommand> {
  constructor(
    @Inject(APPLICATION_REPOSITORY) private readonly applicationRepository: IApplicationRepository,
    @Inject(TENANT_REPOSITORY) private readonly tenantRepository: ITenantRepository,
  ) {}

  async execute(
    command: CreateApplicationCommand,
  ): Promise<Result<ApplicationDto, InvalidApplicationNameError | TenantNotFoundError>> {
    const tenantId = UniqueId.create(command.tenantId);
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) {
      return Result.fail(new TenantNotFoundError(command.tenantId));
    }

    const applicationResult = Application.create({ tenantId, name: command.name });
    if (applicationResult.isFailure) {
      return Result.fail(applicationResult.error);
    }

    const application = applicationResult.value;
    await this.applicationRepository.save(application);

    return Result.ok(ApplicationMapper.toDto(application));
  }
}
