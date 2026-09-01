import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Result } from '@shared/result';
import { EmailDeliveryRejectedError, SmtpProviderUnavailableError } from '../../domain/errors';
import {
  EmailDeliveryError,
  EmailProviderResult,
  IEmailProvider,
  OutgoingEmail,
} from '../../application/ports/email-provider.interface';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Adaptador SMTP: a aplicação nunca conhece a biblioteca ou as respostas do servidor. */
@Injectable()
export class SmtpEmailProvider implements IEmailProvider {
  private readonly logger = new Logger(SmtpEmailProvider.name);

  async send(email: OutgoingEmail): Promise<Result<EmailProviderResult, EmailDeliveryError>> {
    try {
      const transporter = nodemailer.createTransport({
        host: email.smtp.host,
        port: email.smtp.port,
        secure: email.smtp.secure,
        requireTLS: !email.smtp.secure,
        auth: { user: email.smtp.username, pass: email.smtp.password },
        tls: { minVersion: 'TLSv1.2' },
      });
      const response = await transporter.sendMail({
        from: { address: email.smtp.fromEmail, name: email.smtp.fromName },
        to: email.to,
        subject: email.subject,
        text: email.textBody ?? undefined,
        html: email.htmlBody ?? undefined,
      });
      return Result.ok({ providerMessageId: response.messageId });
    } catch (error: unknown) {
      return Result.fail(this.mapError(error));
    }
  }

  private mapError(error: unknown): EmailDeliveryError {
    const code = isRecord(error) && typeof error.code === 'string' ? error.code : undefined;
    const responseCode =
      isRecord(error) && typeof error.responseCode === 'number' ? error.responseCode : undefined;
    const rawMessage =
      error instanceof Error ? error.message : 'Falha desconhecida no provedor SMTP.';
    this.logger.error({ code, responseCode, rawMessage }, 'SMTP delivery failed');

    if (
      (responseCode !== undefined && responseCode >= 400 && responseCode < 500) ||
      ['ECONNECTION', 'ECONNRESET', 'ETIMEDOUT', 'ESOCKET', 'EAI_AGAIN'].includes(code ?? '')
    )
      return new SmtpProviderUnavailableError('Servidor SMTP indisponível ou inacessível.');
    return new EmailDeliveryRejectedError('O servidor SMTP rejeitou o envio do e-mail.');
  }
}
