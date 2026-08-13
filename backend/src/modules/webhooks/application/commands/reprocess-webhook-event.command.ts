import { Command } from '@shared/mediator';
import { Result } from '@shared/result';
import { WebhookEventNotFoundError } from '../../domain/errors/webhook-event-not-found.error';
import { WebhookEventOperationDto } from '../ports/webhook-event-operations.repository.interface';

export class ReprocessWebhookEventCommand extends Command<
  Result<WebhookEventOperationDto, WebhookEventNotFoundError>
> {
  constructor(public readonly eventId: string) {
    super();
  }
}
