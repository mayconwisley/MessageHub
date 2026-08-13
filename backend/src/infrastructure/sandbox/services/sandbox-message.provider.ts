import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { Result } from '@shared/result';
import {
  IMessageProvider,
  MessageDeliveryError,
  ProviderMessageResult,
} from '@modules/messages/application/ports/message-provider.interface';
import { ProviderUnavailableError } from '@modules/messages/domain/errors/provider-unavailable.error';
import { MessageDeliveryRejectedError } from '@modules/messages/domain/errors/message-delivery-rejected.error';

/**
 * Provider determinístico para integração local. Não acessa a Meta nem usa credenciais reais.
 * Destinatários terminados em 0000 simulam rejeição permanente; em 0001, indisponibilidade transitória.
 */
@Injectable()
export class SandboxMessageProvider implements IMessageProvider {
  async send(
    input: Parameters<IMessageProvider['send']>[0],
  ): Promise<Result<ProviderMessageResult, MessageDeliveryError>> {
    const recipient = input.to.replace(/\D/g, '');
    if (recipient.endsWith('0000')) {
      return Result.fail(
        new MessageDeliveryRejectedError('Sandbox: destinatário rejeitado (terminação 0000).'),
      );
    }
    if (recipient.endsWith('0001')) {
      return Result.fail(
        new ProviderUnavailableError('Sandbox: indisponibilidade transitória (terminação 0001).'),
      );
    }
    const providerMessageId = `sandbox_${createHash('sha256')
      .update(`${input.phoneNumberId}:${input.to}:${input.content}:${input.template?.name ?? ''}`)
      .digest('hex')
      .slice(0, 24)}`;
    return Result.ok({ providerMessageId });
  }
}
