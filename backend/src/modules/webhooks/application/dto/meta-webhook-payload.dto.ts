export interface MetaWebhookChange {
  field?: string;
  value?: { metadata?: { phone_number_id?: string } };
}

export interface MetaWebhookPayload {
  object?: string;
  entry?: { changes?: MetaWebhookChange[] }[];
}
