import { Global, Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import * as amqp from 'amqp-connection-manager';
import { RabbitMqConfigService } from '@infrastructure/configuration/rabbitmq-config.service';
import { RABBITMQ_CONNECTION } from './rabbitmq.constants';
import { RabbitMqHealthIndicator } from './rabbitmq-health.indicator';

@Global()
@Module({
  imports: [TerminusModule],
  providers: [
    {
      provide: RABBITMQ_CONNECTION,
      inject: [RabbitMqConfigService],
      useFactory: (config: RabbitMqConfigService): amqp.AmqpConnectionManager =>
        amqp.connect([config.url]),
    },
    RabbitMqHealthIndicator,
  ],
  exports: [RABBITMQ_CONNECTION, RabbitMqHealthIndicator],
})
export class RabbitMqModule implements OnApplicationShutdown {
  constructor(
    @Inject(RABBITMQ_CONNECTION) private readonly connection: amqp.AmqpConnectionManager,
  ) {}

  async onApplicationShutdown(): Promise<void> {
    await this.connection.close();
  }
}
