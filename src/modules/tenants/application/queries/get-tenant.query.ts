import { Query } from '@shared/mediator';
import { Result } from '@shared/result';
import { TenantNotFoundError } from '../../domain/errors/tenant-not-found.error';
import { TenantDto } from '../dto/tenant.dto';

export class GetTenantQuery extends Query<Result<TenantDto, TenantNotFoundError>> {
  constructor(public readonly tenantId: string) {
    super();
  }
}
