import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { TenantStatus } from '../../domain/enums/tenant-status.enum';
import { TenantNotFoundError } from '../../domain/errors/tenant-not-found.error';
import {
  ITenantRepository,
  TENANT_REPOSITORY,
} from '../../domain/repositories/tenant.repository.interface';
import { UpdateTenantStatusCommand } from '../commands/update-tenant-status.command';
import { TenantDto } from '../dto/tenant.dto';
import { TenantMapper } from '../mappers/tenant.mapper';

@CommandHandler(UpdateTenantStatusCommand)
export class UpdateTenantStatusHandler implements ICommandHandler<UpdateTenantStatusCommand> {
  constructor(@Inject(TENANT_REPOSITORY) private readonly tenantRepository: ITenantRepository) {}

  async execute(command: UpdateTenantStatusCommand): Promise<Result<TenantDto, TenantNotFoundError>> {
    const tenant = await this.tenantRepository.findById(UniqueId.create(command.tenantId));
    if (!tenant) {
      return Result.fail(new TenantNotFoundError(command.tenantId));
    }

    if (command.status === TenantStatus.SUSPENDED) {
      tenant.suspend();
    } else {
      tenant.activate();
    }
    await this.tenantRepository.save(tenant);

    return Result.ok(TenantMapper.toDto(tenant));
  }
}
