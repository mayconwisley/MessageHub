import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { createHash } from 'crypto';
import { Result } from '@shared/result';
import { InvalidWebhookSignatureError } from '../../domain/errors/invalid-webhook-signature.error';
import {
  IWebhookEventRepository,
  WEBHOOK_EVENT_REPOSITORY,
} from '../../infrastructure/repositories/postgres-webhook-event.repository';
import { ReceiveMetaWebhookCommand } from '../commands/receive-meta-webhook.command';
import {
  IWebhookEventPublisher,
  WEBHOOK_EVENT_PUBLISHER,
} from '../ports/webhook-event-publisher.interface';
import { MetaWebhookSignatureVerifierService } from '../services/meta-webhook-signature-verifier.service';

@CommandHandler(ReceiveMetaWebhookCommand)
export class ReceiveMetaWebhookHandler implements ICommandHandler<ReceiveMetaWebhookCommand> {
  constructor(
    private readonly signatureVerifier: MetaWebhookSignatureVerifierService,
    @Inject(WEBHOOK_EVENT_REPOSITORY) private readonly webhookEvents: IWebhookEventRepository,
    @Inject(WEBHOOK_EVENT_PUBLISHER) private readonly publisher: IWebhookEventPublisher,
  ) {}

  async execute(command: ReceiveMetaWebhookCommand): Promise<Result<void, InvalidWebhookSignatureError>> {
    const { rawBody, signatureHeader, payload } = command;
    const validSignature = await this.signatureVerifier.verify(rawBody, signatureHeader, payload);
    if (!validSignature) return Result.fail(new InvalidWebhookSignatureError());
    if (payload.object !== 'whatsapp_business_account' || !rawBody) return Result.ok(undefined);

    const event = await this.webhookEvents.register(
      'META_WHATSAPP',
      createHash('sha256').update(rawBody).digest('hex'),
      payload as Record<string, unknown>,
    );
    if (!event) return Result.ok(undefined);
    await this.publisher.publishMetaWebhookReceived(event.id);
    return Result.ok(undefined);
  }
}
