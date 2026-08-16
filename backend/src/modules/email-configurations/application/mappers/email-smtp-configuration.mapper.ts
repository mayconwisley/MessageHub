import { EmailSmtpConfiguration } from '../../domain/entities/email-smtp-configuration.entity';
import { EmailSmtpConfigurationDto } from '../dto/email-smtp-configuration.dto';

export class EmailSmtpConfigurationMapper {
  static toDto(configuration: EmailSmtpConfiguration): EmailSmtpConfigurationDto {
    return {
      id: configuration.id.value,
      source: 'tenant',
      host: configuration.host,
      port: configuration.port,
      secure: configuration.secure,
      username: configuration.username,
      fromEmail: configuration.fromEmail,
      fromName: configuration.fromName,
      createdAt: configuration.createdAt,
      updatedAt: configuration.updatedAt,
    };
  }
}
