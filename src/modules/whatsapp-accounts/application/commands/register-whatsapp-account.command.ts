import { Command } from '@shared/mediator';
import { Result } from '@shared/result';
import { TenantNotFoundError } from '@modules/tenants/domain/errors';
import { InvalidWhatsAppAccountError } from '../../domain/errors/invalid-whatsapp-account.error';
import { WhatsAppAccountDto } from '../dto/whatsapp-account.dto';

export class RegisterWhatsAppAccountCommand extends Command<
  Result<WhatsAppAccountDto, InvalidWhatsAppAccountError | TenantNotFoundError>
> {
  constructor(
    public readonly tenantId: string,
    public readonly wabaId: string,
    public readonly accessToken: string,
  ) {
    super();
  }
}
