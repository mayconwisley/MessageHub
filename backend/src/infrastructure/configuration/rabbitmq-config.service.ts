import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RabbitMqConfigService {
  constructor(private readonly configService: ConfigService) {}

  get url(): string {
    return this.configService.get<string>('rabbitmq.url', { infer: true }) as string;
  }
}
