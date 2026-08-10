import { Injectable } from '@nestjs/common';
import { Result } from '@shared/result';
import {
  IMessageProvider,
  OutgoingMessage,
  ProviderMessageResult,
} from '@modules/messages/application/ports/message-provider.interface';
import { ProviderUnavailableError } from '@modules/messages/domain/errors/provider-unavailable.error';
import { MetaWhatsAppClient } from '../clients/meta-whatsapp.client';
import { MetaErrorMapper } from '../errors/meta-error.mapper';
import { MetaMessageMapper } from '../mappers/meta-message.mapper';

@Injectable()
export class MetaWhatsAppProvider implements IMessageProvider {
  constructor(private readonly client: MetaWhatsAppClient) {}

  async send(
    message: OutgoingMessage,
  ): Promise<Result<ProviderMessageResult, ProviderUnavailableError>> {
    try {
      const payload = MetaMessageMapper.toSendMessageRequest(message);
      const response = await this.client.sendMessage({
        phoneNumberId: message.phoneNumberId,
        accessToken: message.accessToken,
        payload,
      });

      return Result.ok(MetaMessageMapper.toProviderResult(response));
    } catch (error) {
      return Result.fail(MetaErrorMapper.toProviderError(error));
    }
  }
}
