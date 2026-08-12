export interface MetaTextSendMessageRequestDto {
  messaging_product: 'whatsapp';
  to: string;
  type: 'text';
  text: { body: string };
}

export interface MetaTemplateSendMessageRequestDto {
  messaging_product: 'whatsapp';
  to: string;
  type: 'template';
  template: {
    name: string;
    language: { code: string };
    components: Array<{
      type: 'header' | 'body' | 'button';
      index?: number;
      sub_type?: 'quick_reply' | 'url';
      parameters: Array<{ type: 'text'; text: string }>;
    }>;
  };
}

export type MetaSendMessageRequestDto =
  MetaTextSendMessageRequestDto | MetaTemplateSendMessageRequestDto;
