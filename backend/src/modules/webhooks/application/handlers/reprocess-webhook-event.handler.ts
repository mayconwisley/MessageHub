import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result } from '@shared/result';
import { WebhookEventNotFoundError } from '../../domain/errors/webhook-event-not-found.error';
import {
  WEBHOOK_EVENT_PUBLISHER,
  IWebhookEventPublisher,
} from '../ports/webhook-event-publisher.interface';
import {
  IWebhookEventOperationsRepository,
  WEBHOOK_EVENT_OPERATIONS_REPOSITORY,
  WebhookEventOperationDto,
} from '../ports/webhook-event-operations.repository.interface';
import { ReprocessWebhookEventCommand } from '../commands/reprocess-webhook-event.command';

@CommandHandler(ReprocessWebhookEventCommand)
export class ReprocessWebhookEventHandler implements ICommandHandler<ReprocessWebhookEventCommand> {
  constructor(
    @Inject(WEBHOOK_EVENT_OPERATIONS_REPOSITORY)
    private readonly events: IWebhookEventOperationsRepository,
    @Inject(WEBHOOK_EVENT_PUBLISHER) private readonly publisher: IWebhookEventPublisher,
  ) {}

  async execute(
    command: ReprocessWebhookEventCommand,
  ): Promise<Result<WebhookEventOperationDto, WebhookEventNotFoundError>> {
    const event = await this.events.requeue(command.eventId);
    if (!event) return Result.fail(new WebhookEventNotFoundError(command.eventId));
    await this.publisher.publishMetaWebhookReceived(event.id);
    return Result.ok(event);
  }
}
