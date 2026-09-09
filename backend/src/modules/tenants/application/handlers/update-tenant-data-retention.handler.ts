import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { InvalidTenantRetentionError } from '../../domain/errors/invalid-tenant-retention.error';
import { TenantNotFoundError } from '../../domain/errors/tenant-not-found.error';
import {
  ITenantRepository,
  TENANT_REPOSITORY,
} from '../../domain/repositories/tenant.repository.interface';
import { TenantDto } from '../dto/tenant.dto';
import { TenantMapper } from '../mappers/tenant.mapper';
import { UpdateTenantDataRetentionCommand } from '../commands/update-tenant-data-retention.command';

@CommandHandler(UpdateTenantDataRetentionCommand)
export class UpdateTenantDataRetentionHandler
  implements ICommandHandler<UpdateTenantDataRetentionCommand>
{
  constructor(@Inject(TENANT_REPOSITORY) private readonly tenants: ITenantRepository) {}

  async execute(
    command: UpdateTenantDataRetentionCommand,
  ): Promise<Result<TenantDto, TenantNotFoundError | InvalidTenantRetentionError>> {
    const tenant = await this.tenants.findById(UniqueId.create(command.tenantId));
    if (!tenant) return Result.fail(new TenantNotFoundError(command.tenantId));

    const updateResult = tenant.updateDataRetentionDays(command.dataRetentionDays);
    if (updateResult.isFailure) return Result.fail(updateResult.error);

    await this.tenants.save(tenant);
    return Result.ok(TenantMapper.toDto(tenant));
  }
}
