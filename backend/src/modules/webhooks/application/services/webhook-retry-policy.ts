import { Injectable } from '@nestjs/common';

const BACKOFF_MS = [1_000, 5_000, 30_000];
export const MAX_ATTEMPTS = BACKOFF_MS.length + 1;

/** Exponential backoff antes de encaminhar um evento de webhook para a DLQ, espelhando MessageRetryPolicy. */
@Injectable()
export class WebhookRetryPolicy {
  shouldRetry(attempt: number): boolean {
    return attempt < MAX_ATTEMPTS;
  }

  nextDelayMs(attempt: number): number {
    return BACKOFF_MS[Math.min(attempt - 1, BACKOFF_MS.length - 1)];
  }
}
