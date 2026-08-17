import * as nodemailer from 'nodemailer';
import { SmtpConnectionSettings } from '@modules/email-configurations/application/ports/smtp-configuration-resolver.interface';
import { OutgoingEmail } from '@modules/emails/application/ports/email-provider.interface';
import { EmailDeliveryRejectedError } from '@modules/emails/domain/errors/email-delivery-rejected.error';
import { SmtpProviderUnavailableError } from '@modules/emails/domain/errors/smtp-provider-unavailable.error';
import { SmtpEmailProvider } from '@modules/emails/infrastructure/services/smtp-email.provider';

jest.mock('nodemailer');

const createTransportMock = nodemailer.createTransport as unknown as jest.Mock;

const smtpSettings: SmtpConnectionSettings = {
  host: 'smtp.example.com',
  port: 587,
  secure: false,
  username: 'no-reply@example.com',
  password: 'super-secret',
  fromEmail: 'no-reply@example.com',
  fromName: 'Example Corp',
};

function buildOutgoingEmail(overrides: Partial<OutgoingEmail> = {}): OutgoingEmail {
  return {
    to: 'cliente@example.com',
    subject: 'Pedido confirmado',
    textBody: 'Seu pedido foi confirmado.',
    htmlBody: null,
    smtp: smtpSettings,
    ...overrides,
  };
}

describe('SmtpEmailProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends the email through nodemailer and returns the provider message id on success', async () => {
    const sendMail = jest.fn().mockResolvedValue({ messageId: '<provider-message-1@example.com>' });
    createTransportMock.mockReturnValue({ sendMail });

    const provider = new SmtpEmailProvider();
    const result = await provider.send(buildOutgoingEmail());

    expect(result.isSuccess).toBe(true);
    expect(result.value.providerMessageId).toBe('<provider-message-1@example.com>');
  });

  it('maps the outgoing email fields and SMTP settings into the nodemailer calls', async () => {
    const sendMail = jest.fn().mockResolvedValue({ messageId: 'msg-1' });
    createTransportMock.mockReturnValue({ sendMail });

    const provider = new SmtpEmailProvider();
    await provider.send(
      buildOutgoingEmail({
        to: 'destinatario@example.com',
        subject: 'Assunto',
        textBody: 'Corpo texto',
        htmlBody: '<p>Corpo html</p>',
      }),
    );

    expect(createTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        host: smtpSettings.host,
        port: smtpSettings.port,
        secure: smtpSettings.secure,
        requireTLS: !smtpSettings.secure,
        auth: { user: smtpSettings.username, pass: smtpSettings.password },
      }),
    );
    expect(sendMail).toHaveBeenCalledWith({
      from: { address: smtpSettings.fromEmail, name: smtpSettings.fromName },
      to: 'destinatario@example.com',
      subject: 'Assunto',
      text: 'Corpo texto',
      html: '<p>Corpo html</p>',
    });
  });

  it('returns a retryable failure when the transport reports a connection error', async () => {
    const sendMail = jest
      .fn()
      .mockRejectedValue(Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNECTION' }));
    createTransportMock.mockReturnValue({ sendMail });

    const provider = new SmtpEmailProvider();
    const result = await provider.send(buildOutgoingEmail());

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(SmtpProviderUnavailableError);
    expect(result.error.retryable).toBe(true);
    expect(result.error.message).toBe('connect ECONNREFUSED');
  });

  it('returns a retryable failure when the transport reports a 4xx response code', async () => {
    const sendMail = jest
      .fn()
      .mockRejectedValue(Object.assign(new Error('temporary failure'), { responseCode: 450 }));
    createTransportMock.mockReturnValue({ sendMail });

    const provider = new SmtpEmailProvider();
    const result = await provider.send(buildOutgoingEmail());

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(SmtpProviderUnavailableError);
    expect(result.error.retryable).toBe(true);
  });

  it('returns a non-retryable rejection when the provider permanently refuses the message', async () => {
    const sendMail = jest
      .fn()
      .mockRejectedValue(Object.assign(new Error('mailbox unavailable'), { responseCode: 550 }));
    createTransportMock.mockReturnValue({ sendMail });

    const provider = new SmtpEmailProvider();
    const result = await provider.send(buildOutgoingEmail());

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(EmailDeliveryRejectedError);
    expect(result.error.retryable).toBe(false);
    expect(result.error.message).toBe('mailbox unavailable');
  });

  it('falls back to a generic message when the thrown error is not an Error instance', async () => {
    const sendMail = jest.fn().mockRejectedValue('boom');
    createTransportMock.mockReturnValue({ sendMail });

    const provider = new SmtpEmailProvider();
    const result = await provider.send(buildOutgoingEmail());

    expect(result.isFailure).toBe(true);
    expect(result.error.message).toBe('Falha desconhecida no provedor SMTP.');
    expect(result.error.retryable).toBe(false);
  });
});
