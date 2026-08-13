import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediatorModule } from '@shared/mediator';
import { ENGINEERING_ALERT_REPOSITORY } from './application/ports/engineering-alert.repository.interface';
import { EngineeringAlertOrmEntity } from './infrastructure/entities/engineering-alert.orm-entity';
import { PostgresEngineeringAlertRepository } from './infrastructure/repositories/postgres-engineering-alert.repository';
import { EngineeringAlertService } from './application/services/engineering-alert.service';
import { ListEngineeringAlertsHandler } from './application/handlers/list-engineering-alerts.handler';
import { EngineeringAlertsController } from './presentation/controllers/engineering-alerts.controller';

@Global()
@Module({
  imports: [MediatorModule, TypeOrmModule.forFeature([EngineeringAlertOrmEntity])],
  controllers: [EngineeringAlertsController],
  providers: [
    { provide: ENGINEERING_ALERT_REPOSITORY, useClass: PostgresEngineeringAlertRepository },
    EngineeringAlertService,
    ListEngineeringAlertsHandler,
  ],
  exports: [ENGINEERING_ALERT_REPOSITORY, EngineeringAlertService],
})
export class NotificationsModule {}
