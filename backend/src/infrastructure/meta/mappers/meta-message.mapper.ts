import {
  OutgoingMessage,
  ProviderMessageResult,
} from '@modules/messages/application/ports/message-provider.interface';
import { MetaSendMessageRequestDto } from '../dto/meta-send-message-request.dto';
import { MetaSendMessageResponseDto } from '../dto/meta-send-message-response.dto';

export class MetaMessageMapper {
  static toSendMessageRequest(message: OutgoingMessage): MetaSendMessageRequestDto {
    if (message.template) {
      return {
        messaging_product: 'whatsapp',
        to: message.to,
        type: 'template',
        template: {
          name: message.template.name,
          language: { code: message.template.language },
          components: message.template.parameters.map((group) => ({
            type: group.component,
            ...(group.index !== undefined ? { index: group.index } : {}),
            ...(group.component === 'button'
              ? { sub_type: group.action === 'url' ? ('url' as const) : ('quick_reply' as const) }
              : {}),
            parameters: group.values.map((value) => ({ type: 'text' as const, text: value })),
          })),
        },
      };
    }
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
