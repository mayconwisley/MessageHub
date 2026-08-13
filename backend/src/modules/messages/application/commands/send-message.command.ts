import { Command } from '@shared/mediator';
import { Result } from '@shared/result';
import { ApplicationNotFoundError } from '@modules/applications/domain/errors/application-not-found.error';
import { PhoneNumberNotFoundError } from '@modules/phone-numbers/domain/errors';
import { InvalidMessageError } from '../../domain/errors/invalid-message.error';
import { MessageDto } from '../dto/message.dto';

export class SendMessageCommand extends Command<
  Result<MessageDto, InvalidMessageError | ApplicationNotFoundError | PhoneNumberNotFoundError>
> {
  constructor(
    public readonly applicationId: string,
    public readonly phoneNumberId: string,
    public readonly to: string,
    public readonly content: string,
    public readonly idempotencyKey?: string,
    public readonly requestId?: string,
    public readonly requestingTenantId?: string,
  ) {
    super();
  }
}
