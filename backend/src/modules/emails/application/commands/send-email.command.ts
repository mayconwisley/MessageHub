import { Command } from '@shared/mediator';
import { Result } from '@shared/result';
import { ApplicationNotFoundError } from '@modules/applications/domain/errors/application-not-found.error';
import { InvalidEmailMessageError } from '../../domain/errors/invalid-email-message.error';
import { EmailMessageDto } from '../dto/email-message.dto';
export class SendEmailCommand extends Command<
  Result<EmailMessageDto, InvalidEmailMessageError | ApplicationNotFoundError>
> {
  constructor(
    public readonly applicationId: string,
    public readonly to: string,
    public readonly subject: string,
    public readonly textBody: string | undefined,
    public readonly htmlBody: string | undefined,
    public readonly idempotencyKey?: string,
    public readonly requestId?: string,
    public readonly requestingTenantId?: string,
  ) {
    super();
  }
}
