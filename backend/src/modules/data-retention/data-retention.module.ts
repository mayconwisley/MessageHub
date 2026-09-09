import { Global, Module } from '@nestjs/common';
import { PostgresDataRetentionService } from './infrastructure/services/postgres-data-retention.service';

@Global()
@Module({
  providers: [PostgresDataRetentionService],
})
export class DataRetentionModule {}
