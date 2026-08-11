import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogOrmEntity } from './infrastructure/entities/audit-log.orm-entity';
import { AuditLogService } from './infrastructure/services/audit-log.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditLogOrmEntity])],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditModule {}
