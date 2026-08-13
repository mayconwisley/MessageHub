import { DomainError } from '@shared/errors';

export class UserNotFoundError extends DomainError {
  constructor(userId: string) {
    super('USER_NOT_FOUND', `Usuário ${userId} não encontrado.`);
  }
}
