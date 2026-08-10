import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Command } from './command.base';
import { IMediator } from './mediator.interface';
import { Query } from './query.base';

@Injectable()
export class Mediator implements IMediator {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  send<TResult>(command: Command<TResult>): Promise<TResult> {
    return this.commandBus.execute(command);
  }

  query<TResult>(query: Query<TResult>): Promise<TResult> {
    return this.queryBus.execute(query);
  }
}
