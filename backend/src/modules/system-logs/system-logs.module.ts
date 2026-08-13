import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediatorModule } from '@shared/mediator';
import { SYSTEM_LOG_REPOSITORY } from './application/ports/system-log.repository.interface';
import { ListSystemLogsHandler } from './application/handlers/list-system-logs.handler';
import { SystemLogOrmEntity } from './infrastructure/entities/system-log.orm-entity';
import { PostgresSystemLogRepository } from './infrastructure/repositories/postgres-system-log.repository';
import { SystemLogsController } from './presentation/controllers/system-logs.controller';

@Module({
  imports: [MediatorModule, TypeOrmModule.forFeature([SystemLogOrmEntity])],
  controllers: [SystemLogsController],
  providers: [
    { provide: SYSTEM_LOG_REPOSITORY, useClass: PostgresSystemLogRepository },
    ListSystemLogsHandler,
  ],
})
export class SystemLogsModule {}
