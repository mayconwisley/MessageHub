import { EmailAttempt } from '../entities/email-attempt.entity';
export interface IEmailAttemptRepository {
  save(attempt: EmailAttempt): Promise<void>;
}
export const EMAIL_ATTEMPT_REPOSITORY = Symbol('EMAIL_ATTEMPT_REPOSITORY');
