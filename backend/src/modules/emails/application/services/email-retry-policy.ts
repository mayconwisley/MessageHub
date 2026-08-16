import { Injectable } from '@nestjs/common';
const BACKOFF_MS = [1_000, 5_000, 30_000];
@Injectable()
export class EmailRetryPolicy {
  shouldRetry(attemptCount: number): boolean {
    return attemptCount <= BACKOFF_MS.length;
  }
  nextDelayMs(attemptCount: number): number {
    return BACKOFF_MS[Math.min(attemptCount - 1, BACKOFF_MS.length - 1)];
  }
}
