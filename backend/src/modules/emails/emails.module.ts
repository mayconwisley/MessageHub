import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediatorModule } from '@shared/mediator';
import { ApplicationsModule } from '@modules/applications/applications.module';
import { EmailConfigurationsModule } from '@modules/email-configurations/email-configurations.module';
import { ListEmailTimelineHandler } from './application/handlers/list-email-timeline.handler';
import { SendEmailHandler } from './application/handlers/send-email.handler';
import { EMAIL_PROVIDER } from './application/ports/email-provider.interface';
import { EMAIL_PUBLISHER } from './application/ports/email-publisher.interface';
import { EMAIL_TIMELINE_REPOSITORY } from './application/ports/email-timeline.repository.interface';
import { EmailDeliveryProcessor } from './application/services/email-delivery-processor.service';
import { EmailRetryPolicy } from './application/services/email-retry-policy';
import { EMAIL_ATTEMPT_REPOSITORY } from './domain/repositories/email-attempt.repository.interface';
import { EMAIL_MESSAGE_REPOSITORY } from './domain/repositories/email-message.repository.interface';
import { EmailAttemptOrmEntity } from './infrastructure/entities/email-attempt.orm-entity';
import { EmailMessageOrmEntity } from './infrastructure/entities/email-message.orm-entity';
import { EmailTimelineEventOrmEntity } from './infrastructure/entities/email-timeline-event.orm-entity';
import { RabbitMqEmailPublisher } from './infrastructure/messaging/rabbitmq-email-publisher';
import { PostgresEmailAttemptRepository } from './infrastructure/repositories/postgres-email-attempt.repository';
import { PostgresEmailMessageRepository } from './infrastructure/repositories/postgres-email-message.repository';
import { PostgresEmailTimelineRepository } from './infrastructure/repositories/postgres-email-timeline.repository';
import { SmtpEmailProvider } from './infrastructure/services/smtp-email.provider';
import { EmailWorker } from './infrastructure/workers/email.worker';
import { EmailsController } from './presentation/controllers/emails.controller';

@Module({
  imports: [
    MediatorModule,
    ApplicationsModule,
    EmailConfigurationsModule,
    TypeOrmModule.forFeature([
      EmailMessageOrmEntity,
      EmailAttemptOrmEntity,
      EmailTimelineEventOrmEntity,
    ]),
  ],
  controllers: [EmailsController],
  providers: [
    { provide: EMAIL_MESSAGE_REPOSITORY, useClass: PostgresEmailMessageRepository },
    { provide: EMAIL_ATTEMPT_REPOSITORY, useClass: PostgresEmailAttemptRepository },
    { provide: EMAIL_TIMELINE_REPOSITORY, useClass: PostgresEmailTimelineRepository },
    { provide: EMAIL_PROVIDER, useClass: SmtpEmailProvider },
    { provide: EMAIL_PUBLISHER, useClass: RabbitMqEmailPublisher },
    EmailRetryPolicy,
    EmailDeliveryProcessor,
    SendEmailHandler,
    ListEmailTimelineHandler,
    EmailWorker,
  ],
})
export class EmailsModule {}
