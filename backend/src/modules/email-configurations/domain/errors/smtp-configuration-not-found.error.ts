import { InfrastructureError } from '@shared/errors';

export class SmtpConfigurationNotFoundError extends InfrastructureError {
  constructor() {
    super(
      'SMTP_CONFIGURATION_NOT_FOUND',
      'Nenhuma configuração SMTP está disponível para este tenant.',
    );
  }
}
