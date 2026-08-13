import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediatorModule } from '@shared/mediator';
import { MetaModule } from '@infrastructure/meta/meta.module';
import { MetaWhatsAppProvider } from '@infrastructure/meta/services/meta-whatsapp.provider';
import { SandboxModule } from '@infrastructure/sandbox/sandbox.module';
import { SandboxMessageProvider } from '@infrastructure/sandbox/services/sandbox-message.provider';
import { AppConfigService } from '@infrastructure/configuration/app-config.service';
import { ApplicationsModule } from '@modules/applications/applications.module';
import { PhoneNumbersModule } from '@modules/phone-numbers/phone-numbers.module';
import { WhatsAppAccountsModule } from '@modules/whatsapp-accounts/whatsapp-accounts.module';
import { TemplatesModule } from '@modules/templates/templates.module';
import { SendTemplateMessageHandler } from './application/handlers/send-template-message.handler';
import { GetMessageHandler } from './application/handlers/get-message.handler';
import { ListMessagesHandler } from './application/handlers/list-messages.handler';
import { ListMessageAttemptsHandler } from './application/handlers/list-message-attempts.handler';
import { ListMessageTimelineHandler } from './application/handlers/list-message-timeline.handler';
import { SendMessageHandler } from './application/handlers/send-message.handler';
import { MESSAGE_PROVIDER } from './application/ports/message-provider.interface';
import { MESSAGE_PUBLISHER } from './application/ports/message-publisher.interface';
import { MESSAGE_STATUS_WEBHOOK_PUBLISHER } from './application/ports/message-status-webhook-publisher.interface';
import { MessageRetryPolicy } from './application/services/message-retry-policy';
import { ApplicationQuotaService } from './application/services/application-quota.service';
import { MESSAGE_ATTEMPT_REPOSITORY } from './domain/repositories/message-attempt.repository.interface';
import { MESSAGE_REPOSITORY } from './domain/repositories/message.repository.interface';
import { MessageAttemptOrmEntity } from './infrastructure/entities/message-attempt.orm-entity';
import { MessageTimelineEventOrmEntity } from './infrastructure/entities/message-timeline-event.orm-entity';
import { MessageOrmEntity } from './infrastructure/entities/message.orm-entity';
import { RabbitMqMessagePublisher } from './infrastructure/messaging/rabbitmq-message-publisher';
import { RabbitMqMessageStatusWebhookPublisher } from './infrastructure/messaging/rabbitmq-message-status-webhook-publisher';
import { PostgresMessageAttemptRepository } from './infrastructure/repositories/postgres-message-attempt.repository';
import { PostgresMessageRepository } from './infrastructure/repositories/postgres-message.repository';
import { PostgresMessageTimelineRepository } from './infrastructure/repositories/postgres-message-timeline.repository';
import { MESSAGE_TIMELINE_REPOSITORY } from './application/ports/message-timeline.repository.interface';
import { MessageWorker } from './infrastructure/workers/message.worker';
import { MessageStatusWebhookWorker } from './infrastructure/workers/message-status-webhook.worker';
import { SandboxWebhookSimulatorService } from './infrastructure/services/sandbox-webhook-simulator.service';
import { MessagesController } from './presentation/controllers/messages.controller';
import { SandboxController } from './presentation/controllers/sandbox.controller';

@Module({
  imports: [
    MediatorModule,
    TypeOrmModule.forFeature([
      MessageOrmEntity,
      MessageAttemptOrmEntity,
      MessageTimelineEventOrmEntity,
    ]),
    ApplicationsModule,
    PhoneNumbersModule,
    WhatsAppAccountsModule,
    TemplatesModule,
    MetaModule,
    SandboxModule,
  ],
  controllers: [MessagesController, SandboxController],
  providers: [
    { provide: MESSAGE_REPOSITORY, useClass: PostgresMessageRepository },
    { provide: MESSAGE_ATTEMPT_REPOSITORY, useClass: PostgresMessageAttemptRepository },
    { provide: MESSAGE_TIMELINE_REPOSITORY, useClass: PostgresMessageTimelineRepository },
    { provide: MESSAGE_PUBLISHER, useClass: RabbitMqMessagePublisher },
    { provide: MESSAGE_STATUS_WEBHOOK_PUBLISHER, useClass: RabbitMqMessageStatusWebhookPublisher },
    {
      provide: MESSAGE_PROVIDER,
      inject: [AppConfigService, MetaWhatsAppProvider, SandboxMessageProvider],
      useFactory: (
        config: AppConfigService,
        metaProvider: MetaWhatsAppProvider,
        sandboxProvider: SandboxMessageProvider,
      ) => (config.messageProvider === 'sandbox' ? sandboxProvider : metaProvider),
    },
    MessageRetryPolicy,
    ApplicationQuotaService,
    SendMessageHandler,
    SendTemplateMessageHandler,
    GetMessageHandler,
    ListMessagesHandler,
    ListMessageAttemptsHandler,
    ListMessageTimelineHandler,
    MessageWorker,
    MessageStatusWebhookWorker,
    SandboxWebhookSimulatorService,
  ],
  exports: [MESSAGE_REPOSITORY, MESSAGE_STATUS_WEBHOOK_PUBLISHER, MESSAGE_TIMELINE_REPOSITORY],
})
export class MessagesModule {}
