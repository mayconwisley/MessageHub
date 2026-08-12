import { Inject, Injectable } from '@nestjs/common';
import { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';
import * as amqp from 'amqp-connection-manager';
import { RABBITMQ_CONNECTION } from './rabbitmq.constants';

@Injectable()
export class RabbitMqHealthIndicator {
  constructor(
    @Inject(RABBITMQ_CONNECTION) private readonly connection: amqp.AmqpConnectionManager,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  check(key: string): HealthIndicatorResult {
    const indicator = this.healthIndicatorService.check(key);
    if (!this.connection.isConnected()) {
      return indicator.down('RabbitMQ connection is not established.');
    }
    return indicator.up();
  }
}
