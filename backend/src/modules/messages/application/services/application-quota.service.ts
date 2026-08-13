import { Inject, Injectable } from '@nestjs/common';
import { RateLimitExceededError } from '@shared/errors';
import { Application } from '@modules/applications/domain/entities/application.entity';
import {
  IMessageRepository,
  MESSAGE_REPOSITORY,
} from '../../domain/repositories/message.repository.interface';

@Injectable()
export class ApplicationQuotaService {
  constructor(@Inject(MESSAGE_REPOSITORY) private readonly messages: IMessageRepository) {}

  async assertCanAcceptMessage(application: Application): Promise<void> {
    const now = Date.now();
    const [lastMinute, lastDay] = await Promise.all([
      this.messages.countCreatedSince(application.id, new Date(now - 60_000)),
      this.messages.countCreatedSince(application.id, new Date(now - 86_400_000)),
    ]);
    if (lastMinute >= application.quotaPerMinute)
      throw new RateLimitExceededError('quota por minuto da aplicação');
    if (lastDay >= application.quotaPerDay)
      throw new RateLimitExceededError('quota diária da aplicação');
  }
}
