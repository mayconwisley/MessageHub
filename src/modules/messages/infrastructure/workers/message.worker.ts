import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import type { Channel, ConsumeMessage } from 'amqplib';
import { PinoLogger } from 'nestjs-pino';
import { UniqueId } from '@shared/domain';
import { RABBITMQ_CONNECTION } from '@infrastructure/messaging/rabbitmq/rabbitmq.constants';
import {
  IPhoneNumberRepository,
  PHONE_NUMBER_REPOSITORY,
} from '@modules/phone-numbers/domain/repositories/phone-number.repository.interface';
import {
  IWhatsAppAccountRepository,
  WHATSAPP_ACCOUNT_REPOSITORY,
} from '@modules/whatsapp-accounts/domain/repositories/whatsapp-account.repository.interface';
import { Message } from '../../domain/entities/message.entity';
import { MessageAttempt } from '../../domain/entities/message-attempt.entity';
import { MessageAttemptStatus } from '../../domain/enums/message-attempt-status.enum';
import { MessageStatus } from '../../domain/enums/message-status.enum';
import { ProviderUnavailableError } from '../../domain/errors/provider-unavailable.error';
import {
  IMessageAttemptRepository,
  MESSAGE_ATTEMPT_REPOSITORY,
} from '../../domain/repositories/message-attempt.repository.interface';
import {
  IMessageRepository,
  MESSAGE_REPOSITORY,
} from '../../domain/repositories/message.repository.interface';
import {
  IMessageProvider,
  MESSAGE_PROVIDER,
} from '../../application/ports/message-provider.interface';
import {
  IMessagePublisher,
  MESSAGE_PUBLISHER,
  MessageRequestedPayload,
} from '../../application/ports/message-publisher.interface';
import { MessageRetryPolicy } from '../../application/services/message-retry-policy';
import {
  MESSAGE_REQUESTED_DLQ,
  MESSAGE_REQUESTED_QUEUE,
} from '../messaging/message-queues.constant';

/**
 * Consumer de `message.requested` (secao 21/51). Assume at-least-once delivery: mensagens
 * ja processadas (status != PENDING/RETRY) sao ignoradas para preservar idempotencia.
 */
@Injectable()
export class MessageWorker implements OnModuleInit {
  private readonly channelWrapper: amqp.ChannelWrapper;

  constructor(
    @Inject(RABBITMQ_CONNECTION) private readonly connection: amqp.AmqpConnectionManager,
    @Inject(MESSAGE_REPOSITORY) private readonly messageRepository: IMessageRepository,
    @Inject(MESSAGE_ATTEMPT_REPOSITORY)
    private readonly messageAttemptRepository: IMessageAttemptRepository,
    @Inject(PHONE_NUMBER_REPOSITORY) private readonly phoneNumberRepository: IPhoneNumberRepository,
    @Inject(WHATSAPP_ACCOUNT_REPOSITORY)
    private readonly whatsAppAccountRepository: IWhatsAppAccountRepository,
    @Inject(MESSAGE_PROVIDER) private readonly messageProvider: IMessageProvider,
    @Inject(MESSAGE_PUBLISHER) private readonly messagePublisher: IMessagePublisher,
    private readonly retryPolicy: MessageRetryPolicy,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MessageWorker.name);
    this.channelWrapper = this.connection.createChannel({
      json: true,
      setup: async (channel: Channel) => {
        await channel.assertQueue(MESSAGE_REQUESTED_DLQ, { durable: true });
        await channel.assertQueue(MESSAGE_REQUESTED_QUEUE, { durable: true });
        await channel.consume(MESSAGE_REQUESTED_QUEUE, (msg) => {
          void this.handleMessage(msg, channel);
        });
      },
    });
  }

  async onModuleInit(): Promise<void> {
    await this.channelWrapper.waitForConnect();
  }

  private async handleMessage(msg: ConsumeMessage | null, channel: Channel): Promise<void> {
    if (!msg) {
      return;
    }

    try {
      const payload = JSON.parse(msg.content.toString()) as MessageRequestedPayload;
      await this.process(payload.messageId);
    } catch (error: unknown) {
      this.logger.error(
        { err: error },
        'Unexpected failure while processing message.requested event.',
      );
    } finally {
      channel.ack(msg);
    }
  }

  private async process(messageId: string): Promise<void> {
    const message = await this.messageRepository.findById(UniqueId.create(messageId));
    if (!message) {
      this.logger.warn({ messageId }, 'Message not found - skipping.');
      return;
    }

    if (message.status !== MessageStatus.PENDING && message.status !== MessageStatus.RETRY) {
      return;
    }

    message.markProcessing();
    await this.messageRepository.save(message);

    const phoneNumber = await this.phoneNumberRepository.findById(message.phoneNumberId);
    const whatsAppAccount = phoneNumber
      ? await this.whatsAppAccountRepository.findById(phoneNumber.whatsAppAccountId)
      : null;

    if (!phoneNumber || !whatsAppAccount) {
      await this.handleFailure(
        message,
        new ProviderUnavailableError('Phone number or WhatsApp account not found.'),
      );
      return;
    }

    const result = await this.messageProvider.send({
      phoneNumberId: phoneNumber.phoneNumberId,
      credentialSource: whatsAppAccount.credentialSource,
      accessToken: whatsAppAccount.accessToken,
      to: message.to,
      content: message.content.body,
    });

    if (result.isFailure) {
      await this.handleFailure(message, result.error);
      return;
    }

    await this.messageAttemptRepository.save(
      MessageAttempt.create({
        messageId: message.id,
        attemptNumber: message.attemptCount,
        status: MessageAttemptStatus.SUCCEEDED,
      }),
    );

    message.markSent(result.value.providerMessageId);
    await this.messageRepository.save(message);
  }

  private async handleFailure(message: Message, error: ProviderUnavailableError): Promise<void> {
    await this.messageAttemptRepository.save(
      MessageAttempt.create({
        messageId: message.id,
        attemptNumber: message.attemptCount,
        status: MessageAttemptStatus.FAILED,
        errorCode: error.code,
        errorMessage: error.message,
      }),
    );

    message.markFailed();
    await this.messageRepository.save(message);

    if (this.retryPolicy.shouldRetry(message.attemptCount)) {
      message.scheduleRetry();
      await this.messageRepository.save(message);

      const delayMs = this.retryPolicy.nextDelayMs(message.attemptCount);
      const messageId = message.id.value;
      setTimeout(() => {
        this.messagePublisher
          .publishMessageRequested({ messageId })
          .catch((publishError: unknown) => {
            this.logger.error(
              { err: publishError, messageId },
              'Failed to requeue message for retry.',
            );
          });
      }, delayMs);
      return;
    }

    await this.channelWrapper.sendToQueue(
      MESSAGE_REQUESTED_DLQ,
      { messageId: message.id.value },
      { persistent: true },
    );
  }
}
