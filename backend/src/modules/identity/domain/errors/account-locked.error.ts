import { AuthenticationError } from '@shared/errors';

export class AccountLockedError extends AuthenticationError {
  constructor(public readonly lockedUntil: Date) {
    super('ACCOUNT_LOCKED', 'Conta temporariamente bloqueada por excesso de tentativas de login.');
  }
}
