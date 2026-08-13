import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediatorModule } from '@shared/mediator';
import { AUDIT_LOG_REPOSITORY } from './application/ports/audit-log.repository.interface';
import { ListAuditLogsHandler } from './application/handlers/list-audit-logs.handler';
import { AuditLogOrmEntity } from './infrastructure/entities/audit-log.orm-entity';
import { AuditLogService } from './infrastructure/services/audit-log.service';
import { PostgresAuditLogRepository } from './infrastructure/repositories/postgres-audit-log.repository';
import { AuditLogsController } from './presentation/controllers/audit-logs.controller';

@Global()
@Module({
  imports: [MediatorModule, TypeOrmModule.forFeature([AuditLogOrmEntity])],
  controllers: [AuditLogsController],
  providers: [
    AuditLogService,
    { provide: AUDIT_LOG_REPOSITORY, useClass: PostgresAuditLogRepository },
    ListAuditLogsHandler,
  ],
  exports: [AuditLogService],
})
export class AuditModule {}
