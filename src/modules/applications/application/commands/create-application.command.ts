import { Command } from '@shared/mediator';
import { Result } from '@shared/result';
import { TenantNotFoundError } from '@modules/tenants/domain/errors';
import { InvalidApplicationNameError } from '../../domain/errors/invalid-application-name.error';
import { ApplicationDto } from '../dto/application.dto';

export class CreateApplicationCommand extends Command<
  Result<ApplicationDto, InvalidApplicationNameError | TenantNotFoundError>
> {
  constructor(
    public readonly tenantId: string,
    public readonly name: string,
  ) {
    super();
  }
}
