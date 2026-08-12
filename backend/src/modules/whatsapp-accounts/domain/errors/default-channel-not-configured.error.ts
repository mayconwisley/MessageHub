import { DomainError } from '@shared/errors';

export class DefaultChannelNotConfiguredError extends DomainError {
  constructor() {
    super(
      'DEFAULT_CHANNEL_NOT_CONFIGURED',
      'O canal padrão da Meta não está habilitado ou não tem um WABA ID configurado no servidor.',
    );
  }
}
