import { Command } from '@shared/mediator';
import { Result } from '@shared/result';
import { InvalidSmtpConfigurationError } from '../../domain/errors/invalid-smtp-configuration.error';
import { EmailSmtpConfigurationDto } from '../dto/email-smtp-configuration.dto';

export class ConfigureEmailSmtpCommand extends Command<
  Result<EmailSmtpConfigurationDto, InvalidSmtpConfigurationError>
> {
  constructor(
    public readonly tenantId: string,
    public readonly host: string,
    public readonly port: number,
    public readonly secure: boolean,
    public readonly username: string,
    public readonly password: string,
    public readonly fromEmail: string,
    public readonly fromName: string,
  ) {
    super();
  }
}
