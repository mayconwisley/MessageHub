import {
  OutgoingMessage,
  ProviderMessageResult,
} from '@modules/messages/application/ports/message-provider.interface';
import { MetaSendMessageRequestDto } from '../dto/meta-send-message-request.dto';
import { MetaSendMessageResponseDto } from '../dto/meta-send-message-response.dto';

export class MetaMessageMapper {
  static toSendMessageRequest(message: OutgoingMessage): MetaSendMessageRequestDto {
    return {
      messaging_product: 'whatsapp',
      to: message.to,
      type: 'text',
      text: { body: message.content },
    };
  }

  static toProviderResult(response: MetaSendMessageResponseDto): ProviderMessageResult {
    return { providerMessageId: response.messages[0].id };
  }
}
