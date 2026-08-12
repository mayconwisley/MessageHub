import { Command } from '@shared/mediator';
import { Result } from '@shared/result';
import { WhatsAppAccountNotFoundError } from '@modules/whatsapp-accounts/domain/errors';
import { InvalidPhoneNumberError } from '../../domain/errors/invalid-phone-number.error';
import { PhoneNumberDto } from '../dto/phone-number.dto';

export class RegisterPhoneNumberCommand extends Command<
  Result<PhoneNumberDto, InvalidPhoneNumberError | WhatsAppAccountNotFoundError>
> {
  constructor(
    public readonly whatsAppAccountId: string,
    public readonly phoneNumberId: string,
    public readonly displayNumber: string,
    public readonly tenantId?: string,
  ) {
    super();
  }
}
