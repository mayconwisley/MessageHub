import { Injectable } from '@nestjs/common';

const BACKOFF_MS = [1_000, 5_000, 30_000];
export const MAX_ATTEMPTS = BACKOFF_MS.length + 1;

/** Exponential backoff + numero maximo de tentativas antes de encaminhar para a DLQ (secao 22). */
@Injectable()
export class MessageRetryPolicy {
  shouldRetry(attemptCount: number): boolean {
    return attemptCount < MAX_ATTEMPTS;
  }

  nextDelayMs(attemptCount: number): number {
    return BACKOFF_MS[Math.min(attemptCount - 1, BACKOFF_MS.length - 1)];
  }
}
