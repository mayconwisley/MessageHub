import { DomainError } from '@shared/errors';

export class ApplicationNotFoundError extends DomainError {
  constructor(applicationId: string) {
    super('APPLICATION_NOT_FOUND', `Application ${applicationId} not found.`);
  }
}
