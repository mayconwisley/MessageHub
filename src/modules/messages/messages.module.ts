import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediatorModule } from '@shared/mediator';
import { MetaModule } from '@infrastructure/meta/meta.module';
import { MetaWhatsAppProvider } from '@infrastructure/meta/services/meta-whatsapp.provider';
import { ApplicationsModule } from '@modules/applications/applications.module';
import { PhoneNumbersModule } from '@modules/phone-numbers/phone-numbers.module';
import { WhatsAppAccountsModule } from '@modules/whatsapp-accounts/whatsapp-accounts.module';
import { TemplatesModule } from '@modules/templates/templates.module';
import { SendTemplateMessageHandler } from './application/handlers/send-template-message.handler';
import { GetMessageHandler } from './application/handlers/get-message.handler';
import { SendMessageHandler } from './application/handlers/send-message.handler';
import { MESSAGE_PROVIDER } from './application/ports/message-provider.interface';
import { MESSAGE_PUBLISHER } from './application/ports/message-publisher.interface';
import { MessageRetryPolicy } from './application/services/message-retry-policy';
import { MESSAGE_ATTEMPT_REPOSITORY } from './domain/repositories/message-attempt.repository.interface';
import { MESSAGE_REPOSITORY } from './domain/repositories/message.repository.interface';
import { MessageAttemptOrmEntity } from './infrastructure/entities/message-attempt.orm-entity';
import { MessageOrmEntity } from './infrastructure/entities/message.orm-entity';
import { RabbitMqMessagePublisher } from './infrastructure/messaging/rabbitmq-message-publisher';
import { PostgresMessageAttemptRepository } from './infrastructure/repositories/postgres-message-attempt.repository';
import { PostgresMessageRepository } from './infrastructure/repositories/postgres-message.repository';
import { MessageWorker } from './infrastructure/workers/message.worker';
import { MessagesController } from './presentation/controllers/messages.controller';

@Module({
  imports: [
    MediatorModule,
    TypeOrmModule.forFeature([MessageOrmEntity, MessageAttemptOrmEntity]),
    ApplicationsModule,
    PhoneNumbersModule,
    WhatsAppAccountsModule,
    TemplatesModule,
    MetaModule,
  ],
  controllers: [MessagesController],
  providers: [
    { provide: MESSAGE_REPOSITORY, useClass: PostgresMessageRepository },
    { provide: MESSAGE_ATTEMPT_REPOSITORY, useClass: PostgresMessageAttemptRepository },
    { provide: MESSAGE_PUBLISHER, useClass: RabbitMqMessagePublisher },
    { provide: MESSAGE_PROVIDER, useExisting: MetaWhatsAppProvider },
    MessageRetryPolicy,
    SendMessageHandler,
    SendTemplateMessageHandler,
    GetMessageHandler,
    MessageWorker,
  ],
  exports: [MESSAGE_REPOSITORY],
})
export class MessagesModule {}
