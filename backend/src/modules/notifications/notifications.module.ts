import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ENGINEERING_ALERT_REPOSITORY } from './application/ports/engineering-alert.repository.interface';
import { EngineeringAlertOrmEntity } from './infrastructure/entities/engineering-alert.orm-entity';
import { PostgresEngineeringAlertRepository } from './infrastructure/repositories/postgres-engineering-alert.repository';
import { EngineeringAlertService } from './application/services/engineering-alert.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([EngineeringAlertOrmEntity])],
  providers: [
    { provide: ENGINEERING_ALERT_REPOSITORY, useClass: PostgresEngineeringAlertRepository },
    EngineeringAlertService,
  ],
  exports: [ENGINEERING_ALERT_REPOSITORY, EngineeringAlertService],
})
export class NotificationsModule {}
