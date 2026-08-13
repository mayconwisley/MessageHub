import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediatorModule } from '@shared/mediator';
import { ApplicationOrmEntity } from '@modules/applications/infrastructure/entities/application.orm-entity';
import { MessageOrmEntity } from '@modules/messages/infrastructure/entities/message.orm-entity';
import { PhoneNumberOrmEntity } from '@modules/phone-numbers/infrastructure/entities/phone-number.orm-entity';
import { TenantOrmEntity } from '@modules/tenants/infrastructure/entities/tenant.orm-entity';
import { WhatsAppAccountOrmEntity } from '@modules/whatsapp-accounts/infrastructure/entities/whatsapp-account.orm-entity';
import { GetDeliveryStatusHandler } from './application/handlers/get-delivery-status.handler';
import { GetMessageVolumeHandler } from './application/handlers/get-message-volume.handler';
import { GetOperationalHealthHandler } from './application/handlers/get-operational-health.handler';
import { GetRecentMessagesHandler } from './application/handlers/get-recent-messages.handler';
import { GetResourceSummaryHandler } from './application/handlers/get-resource-summary.handler';
import { DASHBOARD_READ_REPOSITORY } from './application/ports/dashboard-read.repository.interface';
import { PostgresDashboardReadRepository } from './infrastructure/repositories/postgres-dashboard-read.repository';
import { DashboardController } from './presentation/controllers/dashboard.controller';

@Module({
  imports: [
    MediatorModule,
    TypeOrmModule.forFeature([
      TenantOrmEntity,
      ApplicationOrmEntity,
      WhatsAppAccountOrmEntity,
      PhoneNumberOrmEntity,
      MessageOrmEntity,
    ]),
  ],
  controllers: [DashboardController],
  providers: [
    { provide: DASHBOARD_READ_REPOSITORY, useClass: PostgresDashboardReadRepository },
    GetResourceSummaryHandler,
    GetMessageVolumeHandler,
    GetDeliveryStatusHandler,
    GetOperationalHealthHandler,
    GetRecentMessagesHandler,
  ],
})
export class DashboardModule {}
