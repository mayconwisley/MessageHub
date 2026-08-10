import { Query } from '@shared/mediator';
import { Result } from '@shared/result';
import { WhatsAppAccountNotFoundError } from '../../domain/errors/whatsapp-account-not-found.error';
import { WhatsAppAccountDto } from '../dto/whatsapp-account.dto';

export class GetWhatsAppAccountQuery extends Query<
  Result<WhatsAppAccountDto, WhatsAppAccountNotFoundError>
> {
  constructor(public readonly whatsAppAccountId: string) {
    super();
  }
}
