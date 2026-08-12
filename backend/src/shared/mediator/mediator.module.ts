import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MEDIATOR } from './mediator.interface';
import { Mediator } from './mediator';

@Module({
  imports: [CqrsModule],
  providers: [{ provide: MEDIATOR, useClass: Mediator }],
  exports: [MEDIATOR, CqrsModule],
})
export class MediatorModule {}
