import { Result } from '@shared/result';
import { SmtpConnectionSettings } from '@modules/email-configurations/application/ports/smtp-configuration-resolver.interface';
import { EmailDeliveryRejectedError, SmtpProviderUnavailableError } from '../../domain/errors';
export type EmailDeliveryError = EmailDeliveryRejectedError | SmtpProviderUnavailableError;
export interface OutgoingEmail {
  to: string;
  subject: string;
  textBody: string | null;
  htmlBody: string | null;
  smtp: SmtpConnectionSettings;
}
export interface EmailProviderResult {
  providerMessageId: string;
}
export interface IEmailProvider {
  send(email: OutgoingEmail): Promise<Result<EmailProviderResult, EmailDeliveryError>>;
}
export const EMAIL_PROVIDER = Symbol('EMAIL_PROVIDER');
