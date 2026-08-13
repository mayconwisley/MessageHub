import { ExecutionContext } from '@nestjs/common';
import { ThrottlerLimitDetail } from '@nestjs/throttler';
import { AppThrottlerGuard } from '@presentation/http/guards/app-throttler.guard';

type ProtectedThrottler = {
  throwThrottlingException(context: ExecutionContext, detail: ThrottlerLimitDetail): Promise<void>;
};

describe('AppThrottlerGuard', () => {
  it('converte o limite de throttling em RateLimitExceededError (429) com o escopo do handler', async () => {
    const guard = Object.create(AppThrottlerGuard.prototype) as unknown as ProtectedThrottler;
    const context = {
      getClass: () => ({ name: 'MessagesController' }),
      getHandler: () => ({ name: 'send' }),
    } as unknown as ExecutionContext;
    const detail = { key: 'default-127.0.0.1' } as ThrottlerLimitDetail;

    let thrown: unknown;
    try {
      await guard.throwThrottlingException(context, detail);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toMatchObject({
      status: 429,
      response: expect.objectContaining({ code: 'RATE_LIMIT_EXCEEDED' }),
    });
  });
});
