import { Command } from '@shared/mediator';
import { Result } from '@shared/result';
import { TenantNotFoundError } from '@modules/tenants/domain/errors';
import { DefaultChannelNotConfiguredError, InvalidWhatsAppAccountError } from '../../domain/errors';
import { WhatsAppAccountDto } from '../dto/whatsapp-account.dto';

export class EnsureDefaultChannelAccountCommand extends Command<
  Result<
    WhatsAppAccountDto,
    DefaultChannelNotConfiguredError | TenantNotFoundError | InvalidWhatsAppAccountError
  >
> {
  constructor(public readonly tenantId: string) {
    super();
  }
}
