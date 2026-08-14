import { Command } from '@shared/mediator';
import { Result } from '@shared/result';
import { InvalidWebhookSignatureError } from '../../domain/errors/invalid-webhook-signature.error';
import { MetaWebhookPayload } from '../dto/meta-webhook-payload.dto';

export class ReceiveMetaWebhookCommand extends Command<Result<void, InvalidWebhookSignatureError>> {
  constructor(
    public readonly signatureHeader: string | undefined,
    public readonly rawBody: Buffer | undefined,
    public readonly payload: MetaWebhookPayload,
  ) {
    super();
  }
}
