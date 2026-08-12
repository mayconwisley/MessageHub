import { Injectable } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler';
import { RateLimitExceededError } from '@shared/errors';
import { toHttpException } from '../result-http.mapper';

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected override throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    const scope = `${context.getClass().name}.${context.getHandler().name} (key: ${throttlerLimitDetail.key})`;
    throw toHttpException(new RateLimitExceededError(scope));
  }
}
