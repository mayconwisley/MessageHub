import { ApplicationNotFoundError } from '@modules/applications/domain/errors/application-not-found.error';
import { PhoneNumberNotFoundError } from '@modules/phone-numbers/domain/errors';
import { Command } from '@shared/mediator';
import { Result } from '@shared/result';
import { RateLimitExceededError } from '@shared/errors';
import {
  AmbiguousPhoneNumberError,
  IdempotencyKeyConflictError,
  InvalidMessageError,
  PhoneNumberNotConfiguredError,
  TemplateNotFoundError,
} from '../../domain/errors';
import { SendMessageResultDto } from '../dto/message.dto';

export class SendTemplateMessageCommand extends Command<
  Result<
    SendMessageResultDto,
    | InvalidMessageError
    | ApplicationNotFoundError
    | PhoneNumberNotFoundError
    | PhoneNumberNotConfiguredError
    | AmbiguousPhoneNumberError
    | TemplateNotFoundError
    | RateLimitExceededError
    | IdempotencyKeyConflictError
  >
> {
  constructor(
    public readonly applicationId: string,
    public readonly phoneNumberId: string | undefined,
    public readonly to: string,
    public readonly template: { id?: string; name?: string },
    public readonly parameters: string[],
    public readonly idempotencyKey?: string,
    public readonly requestId?: string,
    public readonly requestingTenantId?: string,
  ) {
    super();
  }
}
