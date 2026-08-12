import { Module } from '@nestjs/common';
import { MessagesModule } from '@modules/messages/messages.module';
import { PhoneNumbersModule } from '@modules/phone-numbers/phone-numbers.module';
import { WhatsAppAccountsModule } from '@modules/whatsapp-accounts/whatsapp-accounts.module';
import { ApplicationsModule } from '@modules/applications/applications.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetaWebhooksController } from './presentation/controllers/meta-webhooks.controller';
import { WebhookEventOrmEntity } from './infrastructure/entities/webhook-event.orm-entity';
import {
  PostgresWebhookEventRepository,
  WEBHOOK_EVENT_REPOSITORY,
} from './infrastructure/repositories/postgres-webhook-event.repository';
import { WEBHOOK_EVENT_PUBLISHER } from './application/ports/webhook-event-publisher.interface';
import { RabbitMqWebhookEventPublisher } from './infrastructure/messaging/rabbitmq-webhook-event.publisher';
import { INBOUND_MESSAGE_WEBHOOK_PUBLISHER } from './application/ports/inbound-message-webhook-publisher.interface';
import { RabbitMqInboundMessageWebhookPublisher } from './infrastructure/messaging/rabbitmq-inbound-message-webhook.publisher';
import { MetaWebhookProcessor } from './application/services/meta-webhook.processor';
import { WebhookRetryPolicy } from './application/services/webhook-retry-policy';
import { MetaWebhookWorker } from './infrastructure/workers/meta-webhook.worker';
import { InboundMessageWebhookWorker } from './infrastructure/workers/inbound-message-webhook.worker';

/**
 * Recebe, valida, persiste e delega os webhooks Meta para processamento assíncrono.
 */
@Module({
  imports: [
    MessagesModule,
    PhoneNumbersModule,
    WhatsAppAccountsModule,
    ApplicationsModule,
    TypeOrmModule.forFeature([WebhookEventOrmEntity]),
  ],
  controllers: [MetaWebhooksController],
  providers: [
    { provide: WEBHOOK_EVENT_REPOSITORY, useClass: PostgresWebhookEventRepository },
    { provide: WEBHOOK_EVENT_PUBLISHER, useClass: RabbitMqWebhookEventPublisher },
    {
      provide: INBOUND_MESSAGE_WEBHOOK_PUBLISHER,
      useClass: RabbitMqInboundMessageWebhookPublisher,
    },
    MetaWebhookProcessor,
    WebhookRetryPolicy,
    MetaWebhookWorker,
    InboundMessageWebhookWorker,
  ],
})
export class WebhooksModule {}
