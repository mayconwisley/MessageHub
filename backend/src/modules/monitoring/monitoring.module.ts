import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediatorModule } from '@shared/mediator';
import { ApplicationOrmEntity } from '@modules/applications/infrastructure/entities/application.orm-entity';
import { ApiKeyOrmEntity } from '@modules/applications/infrastructure/entities/api-key.orm-entity';
import { MessageOrmEntity } from '@modules/messages/infrastructure/entities/message.orm-entity';
import { PhoneNumberOrmEntity } from '@modules/phone-numbers/infrastructure/entities/phone-number.orm-entity';
import { WhatsAppAccountOrmEntity } from '@modules/whatsapp-accounts/infrastructure/entities/whatsapp-account.orm-entity';
import { MonitoringReadRepository } from './infrastructure/monitoring-read.repository';
import { MONITORING_READ_REPOSITORY } from './application/ports/monitoring-read.repository.interface';
import { GetIntegrationMonitorHandler } from './application/handlers/get-integration-monitor.handler';
import { GetOperationalSummaryHandler } from './application/handlers/get-operational-summary.handler';
import { MonitoringController } from './presentation/monitoring.controller';
import { EmailMessageOrmEntity } from '@modules/emails/infrastructure/entities/email-message.orm-entity';
import { OutboxEventOrmEntity } from '@infrastructure/database/entities/outbox-event.orm-entity';

@Module({
  imports: [
    MediatorModule,
    TypeOrmModule.forFeature([
      ApplicationOrmEntity,
      ApiKeyOrmEntity,
      MessageOrmEntity,
      PhoneNumberOrmEntity,
      WhatsAppAccountOrmEntity,
      EmailMessageOrmEntity,
      OutboxEventOrmEntity,
    ]),
  ],
  controllers: [MonitoringController],
  providers: [
    { provide: MONITORING_READ_REPOSITORY, useClass: MonitoringReadRepository },
    GetIntegrationMonitorHandler,
    GetOperationalSummaryHandler,
  ],
})
export class MonitoringModule {}
