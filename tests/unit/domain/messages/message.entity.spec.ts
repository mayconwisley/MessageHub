import { UniqueId } from '@shared/domain';
import { Message } from '@modules/messages/domain/entities/message.entity';
import { MessageStatus } from '@modules/messages/domain/enums/message-status.enum';

function createMessage(): Message {
  const result = Message.create({
    tenantId: UniqueId.create(),
    applicationId: UniqueId.create(),
    phoneNumberId: UniqueId.create(),
    to: '+5511999999999',
    content: 'hello',
  });
  if (result.isFailure) {
    throw new Error('Unexpected failure creating message fixture.');
  }
  return result.value;
}

describe('Message', () => {
  it('starts as PENDING with zero attempts', () => {
    const message = createMessage();

    expect(message.status).toBe(MessageStatus.PENDING);
    expect(message.attemptCount).toBe(0);
  });

  it('rejects empty content', () => {
    const result = Message.create({
      tenantId: UniqueId.create(),
      applicationId: UniqueId.create(),
      phoneNumberId: UniqueId.create(),
      to: '+5511999999999',
      content: '   ',
    });

    expect(result.isFailure).toBe(true);
    expect(result.error.code).toBe('INVALID_MESSAGE');
  });

  it('follows the happy path PENDING -> PROCESSING -> SENT', () => {
    const message = createMessage();

    message.markProcessing();
    expect(message.status).toBe(MessageStatus.PROCESSING);
    expect(message.attemptCount).toBe(1);

    message.markSent('wamid.HBg');
    expect(message.status).toBe(MessageStatus.SENT);
    expect(message.providerMessageId).toBe('wamid.HBg');
  });

  it('follows the failure path PROCESSING -> FAILED -> RETRY -> PROCESSING', () => {
    const message = createMessage();

    message.markProcessing();
    message.markFailed();
    expect(message.status).toBe(MessageStatus.FAILED);

    message.scheduleRetry();
    expect(message.status).toBe(MessageStatus.RETRY);

    message.markProcessing();
    expect(message.status).toBe(MessageStatus.PROCESSING);
    expect(message.attemptCount).toBe(2);
  });

  it('rejects invalid state transitions', () => {
    const message = createMessage();

    expect(() => message.markSent('wamid.HBg')).toThrow();
    expect(() => message.markFailed()).toThrow();
  });
});
