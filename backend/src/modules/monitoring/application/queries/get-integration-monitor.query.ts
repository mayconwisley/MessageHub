import { Query } from '@shared/mediator';
import { Result } from '@shared/result';
import { ApplicationNotFoundError } from '@modules/applications/domain/errors/application-not-found.error';
import { IntegrationMonitorDto } from '../ports/monitoring-read.repository.interface';
export class GetIntegrationMonitorQuery extends Query<
  Result<IntegrationMonitorDto, ApplicationNotFoundError>
> {
  constructor(public readonly applicationId: string) {
    super();
  }
}
