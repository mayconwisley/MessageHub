import { Injectable } from '@nestjs/common';
import { Result } from '@shared/result';
import {
  IMessageProvider,
  MessageDeliveryError,
  OutgoingMessage,
  ProviderMessageResult,
} from '@modules/messages/application/ports/message-provider.interface';
import { ProviderUnavailableError } from '@modules/messages/domain/errors/provider-unavailable.error';
import { MetaConfigService } from '@infrastructure/configuration/meta-config.service';
import { WhatsAppCredentialSource } from '@modules/whatsapp-accounts/domain/enums/whatsapp-credential-source.enum';
import { MetaWhatsAppClient } from '../clients/meta-whatsapp.client';
import { MetaErrorMapper } from '../errors/meta-error.mapper';
import { MetaMessageMapper } from '../mappers/meta-message.mapper';

@Injectable()
export class MetaWhatsAppProvider implements IMessageProvider {
  constructor(
    private readonly client: MetaWhatsAppClient,
    private readonly metaConfig: MetaConfigService,
  ) {}

  async send(
    message: OutgoingMessage,
  ): Promise<Result<ProviderMessageResult, MessageDeliveryError>> {
    const accessToken = this.resolveAccessToken(message);
    if (!accessToken) {
      return Result.fail(
        new ProviderUnavailableError('Tenant Meta access token is not configured.'),
      );
    }

    try {
      const payload = MetaMessageMapper.toSendMessageRequest(message);
      const response = await this.client.sendMessage({
        phoneNumberId: message.phoneNumberId,
        accessToken,
        payload,
      });

      return Result.ok(MetaMessageMapper.toProviderResult(response));
    } catch (error) {
      return Result.fail(MetaErrorMapper.toProviderError(error));
    }
  }

  private resolveAccessToken(message: OutgoingMessage): string | null {
    if (message.credentialSource === WhatsAppCredentialSource.DEFAULT) {
      return this.metaConfig.defaultChannelEnabled ? this.metaConfig.defaultAccessToken : null;
    }

    return message.accessToken;
  }
}
