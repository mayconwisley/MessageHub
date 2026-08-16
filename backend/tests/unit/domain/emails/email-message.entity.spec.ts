import { UniqueId } from '@shared/domain';
import { EmailMessage } from '@modules/emails/domain/entities/email-message.entity';
import { EmailStatus } from '@modules/emails/domain/enums/email-status.enum';

describe('EmailMessage', () => {
  const applicationId = UniqueId.create('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
  const tenantId = UniqueId.create('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');

  it('cria mensagem pendente com corpo texto e transiciona ao envio', () => {
    const result = EmailMessage.create({
      tenantId,
      applicationId,
      to: 'cliente@example.com',
      subject: 'Pedido confirmado',
      textBody: 'Seu pedido foi confirmado.',
    });

    expect(result.isSuccess).toBe(true);
    if (result.isFailure) return;
    expect(result.value.status).toBe(EmailStatus.PENDING);

    result.value.markProcessing();
    result.value.markSent('<provider@example.com>');

    expect(result.value.status).toBe(EmailStatus.SENT);
    expect(result.value.attemptCount).toBe(1);
  });

  it('rejeita mensagem sem nenhum corpo', () => {
    const result = EmailMessage.create({
      tenantId,
      applicationId,
      to: 'cliente@example.com',
      subject: 'Pedido confirmado',
    });

    expect(result.isFailure).toBe(true);
  });
});
