import { Command } from '@shared/mediator';
import { Result } from '@shared/result';
import { InvalidTenantNameError } from '../../domain/errors/invalid-tenant-name.error';
import { TenantDto } from '../dto/tenant.dto';

export class CreateTenantCommand extends Command<Result<TenantDto, InvalidTenantNameError>> {
  constructor(public readonly name: string) {
    super();
  }
}
