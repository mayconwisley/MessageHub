import { Injectable } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler';
import { Response } from 'express';
import { RateLimitExceededError } from '@shared/errors';
import { toHttpException } from '../result-http.mapper';

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected override throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    // A guard base do Nest ja define um header Retry-After em milissegundos antes de chegar
    // aqui; sobrescrevemos com o valor correto em segundos, conforme a especificacao HTTP.
    const retryAfterSeconds = Math.max(1, Math.ceil(throttlerLimitDetail.timeToBlockExpire / 1000));
    const response = context.switchToHttp().getResponse<Response>();
    response.header('Retry-After', String(retryAfterSeconds));

    throw toHttpException(new RateLimitExceededError('esta operação', retryAfterSeconds));
  }
}
