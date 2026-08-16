import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { SmtpConfigurationNotFoundError } from '../../domain/errors/smtp-configuration-not-found.error';

export interface SmtpConnectionSettings {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
}

export interface ResolvedSmtpConfiguration {
  settings: SmtpConnectionSettings;
  source: 'default' | 'tenant';
}

/** Porta para resolver credenciais SMTP sem expor detalhes de ambiente aos casos de uso. */
export interface ISmtpConfigurationResolver {
  resolve(
    tenantId: UniqueId,
  ): Promise<Result<ResolvedSmtpConfiguration, SmtpConfigurationNotFoundError>>;
}

export const SMTP_CONFIGURATION_RESOLVER = Symbol('SMTP_CONFIGURATION_RESOLVER');
