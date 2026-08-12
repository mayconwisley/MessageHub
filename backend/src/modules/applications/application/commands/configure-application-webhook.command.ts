import { Command } from '@shared/mediator';
import { Result } from '@shared/result';
import { ApplicationNotFoundError } from '../../domain/errors/application-not-found.error';
import { ApplicationDto } from '../dto/application.dto';

export class ConfigureApplicationWebhookCommand extends Command<
  Result<ApplicationDto, ApplicationNotFoundError>
> {
  constructor(
    public readonly applicationId: string,
    public readonly webhookUrl: string | null,
  ) {
    super();
  }
}
