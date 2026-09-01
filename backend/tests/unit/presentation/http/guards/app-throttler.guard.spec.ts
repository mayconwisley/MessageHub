import { ExecutionContext } from '@nestjs/common';
import { ThrottlerLimitDetail } from '@nestjs/throttler';
import { AppThrottlerGuard } from '@presentation/http/guards/app-throttler.guard';

type ProtectedThrottler = {
  throwThrottlingException(context: ExecutionContext, detail: ThrottlerLimitDetail): Promise<void>;
};

describe('AppThrottlerGuard', () => {
  it('converte o limite de throttling em RateLimitExceededError (429), sem vazar detalhes internos, com Retry-After em segundos', async () => {
    const guard = Object.create(AppThrottlerGuard.prototype) as unknown as ProtectedThrottler;
    const header = jest.fn();
    const context = {
      getClass: () => ({ name: 'MessagesController' }),
      getHandler: () => ({ name: 'send' }),
      switchToHttp: () => ({
        getRequest: () => ({}),
        getResponse: () => ({ header }),
      }),
    } as unknown as ExecutionContext;
    const detail = { key: 'default-127.0.0.1', timeToBlockExpire: 42_500 } as ThrottlerLimitDetail;

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
    const responseBody = (thrown as { response: { message: string } }).response;
    expect(responseBody.message).not.toMatch(/MessagesController|default-127\.0\.0\.1/);
    expect(responseBody.message).toContain('43 segundos');
    expect(header).toHaveBeenCalledWith('Retry-After', '43');
  });
});
