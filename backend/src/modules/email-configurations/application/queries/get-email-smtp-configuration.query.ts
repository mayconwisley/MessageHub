import { Query } from '@shared/mediator';
import { BaseError } from '@shared/errors';
import { Result } from '@shared/result';
import { EmailSmtpConfigurationDto } from '../dto/email-smtp-configuration.dto';

export class GetEmailSmtpConfigurationQuery extends Query<
  Result<EmailSmtpConfigurationDto, BaseError>
> {
  constructor(public readonly tenantId: string) {
    super();
  }
}
