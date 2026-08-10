export interface MetaSendMessageRequestDto {
  messaging_product: 'whatsapp';
  to: string;
  type: 'text';
  text: { body: string };
}
