import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { TenantNotFoundError } from '../../domain/errors/tenant-not-found.error';
import {
  ITenantRepository,
  TENANT_REPOSITORY,
} from '../../domain/repositories/tenant.repository.interface';
import { TenantDto } from '../dto/tenant.dto';
import { TenantMapper } from '../mappers/tenant.mapper';
import { GetTenantQuery } from '../queries/get-tenant.query';

@QueryHandler(GetTenantQuery)
export class GetTenantHandler implements IQueryHandler<GetTenantQuery> {
  constructor(@Inject(TENANT_REPOSITORY) private readonly tenantRepository: ITenantRepository) {}

  async execute(query: GetTenantQuery): Promise<Result<TenantDto, TenantNotFoundError>> {
    const tenant = await this.tenantRepository.findById(UniqueId.create(query.tenantId));
    if (!tenant) {
      return Result.fail(new TenantNotFoundError(query.tenantId));
    }

    return Result.ok(TenantMapper.toDto(tenant));
  }
}
