import { Command } from './command.base';
import { Query } from './query.base';

export interface IMediator {
  send<TResult>(command: Command<TResult>): Promise<TResult>;
  query<TResult>(query: Query<TResult>): Promise<TResult>;
}

export const MEDIATOR = Symbol('MEDIATOR');
