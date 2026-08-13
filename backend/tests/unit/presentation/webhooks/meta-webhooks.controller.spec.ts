import { ForbiddenException } from '@nestjs/common';
import { MetaWebhooksController } from '@modules/webhooks/presentation/controllers/meta-webhooks.controller';
import { MetaConfigService } from '@infrastructure/configuration/meta-config.service';
import { IMediator } from '@shared/mediator';

function createController(webhookVerifyToken: string | null): MetaWebhooksController {
  const config = { webhookVerifyToken } as unknown as MetaConfigService;
  const mediator = { send: jest.fn(), query: jest.fn() } as unknown as IMediator;
  return new MetaWebhooksController(config, mediator);
}

describe('MetaWebhooksController.verify', () => {
  it('retorna o challenge quando o token e o modo são válidos', () => {
    const controller = createController('super-secret-token');

    expect(controller.verify('subscribe', 'super-secret-token', 'challenge-123')).toBe(
      'challenge-123',
    );
  });

  it('rejeita quando o modo não é subscribe', () => {
    const controller = createController('super-secret-token');

    expect(() => controller.verify('unsubscribe', 'super-secret-token', 'challenge-123')).toThrow(
      ForbiddenException,
    );
  });

  it('rejeita quando o token informado é diferente (mesmo tamanho)', () => {
    const controller = createController('super-secret-token');

    expect(() => controller.verify('subscribe', 'super-secret-tokex', 'challenge-123')).toThrow(
      ForbiddenException,
    );
  });

  it('rejeita quando o token informado tem tamanho diferente', () => {
    const controller = createController('super-secret-token');

    expect(() => controller.verify('subscribe', 'short', 'challenge-123')).toThrow(
      ForbiddenException,
    );
  });

  it('rejeita quando o token informado está ausente', () => {
    const controller = createController('super-secret-token');

    expect(() => controller.verify('subscribe', undefined, 'challenge-123')).toThrow(
      ForbiddenException,
    );
  });

  it('rejeita quando não há token configurado no ambiente', () => {
    const controller = createController(null);

    expect(() => controller.verify('subscribe', 'anything', 'challenge-123')).toThrow(
      ForbiddenException,
    );
  });
});
