import { Query } from '@shared/mediator';
import { Result } from '@shared/result';
import { ApplicationNotFoundError } from '../../domain/errors/application-not-found.error';
import { ApplicationDto } from '../dto/application.dto';

export class GetApplicationQuery extends Query<Result<ApplicationDto, ApplicationNotFoundError>> {
  constructor(public readonly applicationId: string) {
    super();
  }
}
