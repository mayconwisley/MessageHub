import { Module } from '@nestjs/common';
import { MessagesModule } from '@modules/messages/messages.module';
import { PhoneNumbersModule } from '@modules/phone-numbers/phone-numbers.module';
import { WhatsAppAccountsModule } from '@modules/whatsapp-accounts/whatsapp-accounts.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetaWebhooksController } from './presentation/controllers/meta-webhooks.controller';
import { WebhookEventOrmEntity } from './infrastructure/entities/webhook-event.orm-entity';
import {
  PostgresWebhookEventRepository,
  WEBHOOK_EVENT_REPOSITORY,
} from './infrastructure/repositories/postgres-webhook-event.repository';
import { WEBHOOK_EVENT_PUBLISHER } from './application/ports/webhook-event-publisher.interface';
import { RabbitMqWebhookEventPublisher } from './infrastructure/messaging/rabbitmq-webhook-event.publisher';
import { MetaWebhookProcessor } from './application/services/meta-webhook.processor';
import { MetaWebhookWorker } from './infrastructure/workers/meta-webhook.worker';

/**
 * Recebe, valida, persiste e delega os webhooks Meta para processamento assíncrono.
 */
@Module({
  imports: [
    MessagesModule,
    PhoneNumbersModule,
    WhatsAppAccountsModule,
    TypeOrmModule.forFeature([WebhookEventOrmEntity]),
  ],
  controllers: [MetaWebhooksController],
  providers: [
    { provide: WEBHOOK_EVENT_REPOSITORY, useClass: PostgresWebhookEventRepository },
    { provide: WEBHOOK_EVENT_PUBLISHER, useClass: RabbitMqWebhookEventPublisher },
    MetaWebhookProcessor,
    MetaWebhookWorker,
  ],
})
export class WebhooksModule {}
