import { Command } from '@shared/mediator';
import { Result } from '@shared/result';
import { TenantNotFoundError } from '@modules/tenants/domain/errors';
import { InvalidWhatsAppAccountError } from '../../domain/errors/invalid-whatsapp-account.error';
import { WhatsAppCredentialSource } from '../../domain/enums/whatsapp-credential-source.enum';
import { WhatsAppAccountDto } from '../dto/whatsapp-account.dto';

export class RegisterWhatsAppAccountCommand extends Command<
  Result<WhatsAppAccountDto, InvalidWhatsAppAccountError | TenantNotFoundError>
> {
  constructor(
    public readonly tenantId: string,
    public readonly wabaId: string,
    public readonly credentialSource: WhatsAppCredentialSource,
    public readonly accessToken?: string,
    public readonly appSecret?: string,
  ) {
    super();
  }
}
