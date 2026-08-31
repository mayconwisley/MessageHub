import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboxEventOrmEntity } from '../database/entities/outbox-event.orm-entity';
import { OutboxDispatcherService } from './outbox-dispatcher.service';
import { OutboxRepository } from './outbox.repository';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([OutboxEventOrmEntity])],
  providers: [OutboxRepository, OutboxDispatcherService],
  exports: [OutboxRepository],
})
export class OutboxModule {}
