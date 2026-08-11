export interface IWebhookEventPublisher {
  publishMetaWebhookReceived(eventId: string): Promise<void>;
}
export const WEBHOOK_EVENT_PUBLISHER = Symbol('WEBHOOK_EVENT_PUBLISHER');
