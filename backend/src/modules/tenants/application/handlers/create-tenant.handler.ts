import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result } from '@shared/result';
import { Tenant } from '../../domain/entities/tenant.entity';
import { InvalidTenantNameError } from '../../domain/errors/invalid-tenant-name.error';
import {
  ITenantRepository,
  TENANT_REPOSITORY,
} from '../../domain/repositories/tenant.repository.interface';
import { CreateTenantCommand } from '../commands/create-tenant.command';
import { TenantDto } from '../dto/tenant.dto';
import { TenantMapper } from '../mappers/tenant.mapper';

@CommandHandler(CreateTenantCommand)
export class CreateTenantHandler implements ICommandHandler<CreateTenantCommand> {
  constructor(@Inject(TENANT_REPOSITORY) private readonly tenantRepository: ITenantRepository) {}

  async execute(command: CreateTenantCommand): Promise<Result<TenantDto, InvalidTenantNameError>> {
    const tenantResult = Tenant.create({ name: command.name });
    if (tenantResult.isFailure) {
      return Result.fail(tenantResult.error);
    }

    const tenant = tenantResult.value;
    await this.tenantRepository.save(tenant);

    return Result.ok(TenantMapper.toDto(tenant));
  }
}
