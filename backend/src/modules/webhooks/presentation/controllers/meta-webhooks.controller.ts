import {
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { createHash, createHmac, timingSafeEqual } from 'crypto';
import { Request } from 'express';
import { PinoLogger } from 'nestjs-pino';
import { MetaConfigService } from '@infrastructure/configuration/meta-config.service';
import { Inject } from '@nestjs/common';
import {
  IPhoneNumberRepository,
  PHONE_NUMBER_REPOSITORY,
} from '@modules/phone-numbers/domain/repositories/phone-number.repository.interface';
import {
  IWhatsAppAccountRepository,
  WHATSAPP_ACCOUNT_REPOSITORY,
} from '@modules/whatsapp-accounts/domain/repositories/whatsapp-account.repository.interface';
import {
  IWebhookEventRepository,
  WEBHOOK_EVENT_REPOSITORY,
} from '../../infrastructure/repositories/postgres-webhook-event.repository';
import {
  IWebhookEventPublisher,
  WEBHOOK_EVENT_PUBLISHER,
} from '../../application/ports/webhook-event-publisher.interface';

interface MetaChange {
  field?: string;
  value?: { metadata?: { phone_number_id?: string } };
}
interface MetaWebhookPayload {
  object?: string;
  entry?: { changes?: MetaChange[] }[];
}
interface RawBodyRequest extends Request {
  rawBody?: Buffer;
}

@ApiTags('webhooks')
@Controller('webhooks/meta')
export class MetaWebhooksController {
  constructor(
    private readonly config: MetaConfigService,
    @Inject(PHONE_NUMBER_REPOSITORY) private readonly phoneNumbers: IPhoneNumberRepository,
    @Inject(WHATSAPP_ACCOUNT_REPOSITORY) private readonly accounts: IWhatsAppAccountRepository,
    @Inject(WEBHOOK_EVENT_REPOSITORY) private readonly webhookEvents: IWebhookEventRepository,
    @Inject(WEBHOOK_EVENT_PUBLISHER) private readonly publisher: IWebhookEventPublisher,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MetaWebhooksController.name);
  }

  @Get()
  @ApiExcludeEndpoint()
  verify(
    @Query('hub.mode') mode?: string,
    @Query('hub.verify_token') verifyToken?: string,
    @Query('hub.challenge') challenge?: string,
  ): string {
    if (
      mode !== 'subscribe' ||
      !this.config.webhookVerifyToken ||
      verifyToken !== this.config.webhookVerifyToken
    ) {
      throw new ForbiddenException();
    }
    return challenge ?? '';
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async receive(@Req() request: RawBodyRequest): Promise<void> {
    await this.assertSignature(request);
    const payload = request.body as MetaWebhookPayload;
    if (payload.object !== 'whatsapp_business_account') return;

    const event = await this.webhookEvents.register(
      'META_WHATSAPP',
      createHash('sha256')
        .update(request.rawBody as Buffer)
        .digest('hex'),
      payload as Record<string, unknown>,
    );
    if (!event) return;
    await this.publisher.publishMetaWebhookReceived(event.id);
  }

  private async assertSignature(request: RawBodyRequest): Promise<void> {
    const signature = request.header('x-hub-signature-256');
    const body = request.rawBody;
    if (!signature?.startsWith('sha256=') || !body) throw new ForbiddenException();
    const received = signature.slice('sha256='.length);
    const receivedBytes = Buffer.from(received, 'hex');
    const candidates = await this.resolveAppSecrets(body);
    if (!candidates.some((secret) => this.signatureMatches(body, secret, receivedBytes)))
      throw new ForbiddenException();
  }

  private async resolveAppSecrets(body: Buffer): Promise<string[]> {
    const secrets = new Set<string>();
    if (this.config.appSecret) secrets.add(this.config.appSecret);
    try {
      const payload = JSON.parse(body.toString('utf8')) as MetaWebhookPayload;
      for (const entry of payload.entry ?? [])
        for (const change of entry.changes ?? []) {
          const providerPhoneId = change.value?.metadata?.phone_number_id;
          if (!providerPhoneId) continue;
          const phone = await this.phoneNumbers.findByProviderPhoneNumberId(providerPhoneId);
          const account = phone ? await this.accounts.findById(phone.whatsAppAccountId) : null;
          if (account?.appSecret) secrets.add(account.appSecret);
        }
    } catch {
      /* An invalid body has no tenant-specific candidate; fallback may still reject it. */
    }
    return [...secrets];
  }

  private signatureMatches(body: Buffer, secret: string, received: Buffer): boolean {
    const expected = Buffer.from(createHmac('sha256', secret).update(body).digest('hex'), 'hex');
    return expected.length === received.length && timingSafeEqual(expected, received);
  }
}
