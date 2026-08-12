import { Command } from '@shared/mediator';
import { Result } from '@shared/result';
import { TenantNotFoundError } from '../../domain/errors/tenant-not-found.error';
import { TenantStatus } from '../../domain/enums/tenant-status.enum';
import { TenantDto } from '../dto/tenant.dto';

export class UpdateTenantStatusCommand extends Command<Result<TenantDto, TenantNotFoundError>> {
  constructor(
    public readonly tenantId: string,
    public readonly status: TenantStatus,
  ) {
    super();
  }
}
