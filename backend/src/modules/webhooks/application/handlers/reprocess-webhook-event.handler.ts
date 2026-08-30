import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result } from '@shared/result';
import { WebhookEventNotFoundError } from '../../domain/errors/webhook-event-not-found.error';
import { OutboxRepository } from '@infrastructure/outbox/outbox.repository';
import { OutboxEventType } from '@shared/outbox';
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
    private readonly outbox: OutboxRepository,
  ) {}

  async execute(
    command: ReprocessWebhookEventCommand,
  ): Promise<Result<WebhookEventOperationDto, WebhookEventNotFoundError>> {
    const outboxEvent = {
      eventType: OutboxEventType.META_WEBHOOK_RECEIVED,
      aggregateType: 'WebhookEvent',
      aggregateId: command.eventId,
      payload: { eventId: command.eventId, attempt: 1 },
    };
    const event = this.events.requeueWithOutbox
      ? await this.events.requeueWithOutbox(command.eventId, outboxEvent)
      : await this.events.requeue(command.eventId);
    if (!event) return Result.fail(new WebhookEventNotFoundError(command.eventId));
    if (!this.events.requeueWithOutbox) await this.outbox.add(outboxEvent);
    return Result.ok(event);
  }
}
