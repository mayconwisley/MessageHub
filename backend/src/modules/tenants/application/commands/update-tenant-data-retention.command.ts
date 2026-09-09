import { Command } from '@shared/mediator';
import { Result } from '@shared/result';
import { TenantNotFoundError } from '../../domain/errors/tenant-not-found.error';
import { InvalidTenantRetentionError } from '../../domain/errors/invalid-tenant-retention.error';
import { TenantDto } from '../dto/tenant.dto';

export class UpdateTenantDataRetentionCommand extends Command<
  Result<TenantDto, TenantNotFoundError | InvalidTenantRetentionError>
> {
  constructor(
    public readonly tenantId: string,
    public readonly dataRetentionDays: number,
  ) {
    super();
  }
}
