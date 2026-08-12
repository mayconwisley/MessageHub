import { Entity, UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { ApplicationStatus } from '../enums/application-status.enum';
import { InvalidApplicationNameError } from '../errors/invalid-application-name.error';

export interface ApplicationProps {
  tenantId: UniqueId;
  name: string;
  status: ApplicationStatus;
  createdAt: Date;
}

export interface CreateApplicationParams {
  tenantId: UniqueId;
  name: string;
}

export class Application extends Entity<ApplicationProps> {
  private constructor(props: ApplicationProps, id?: UniqueId) {
    super(props, id);
  }

  static create(
    params: CreateApplicationParams,
    id?: UniqueId,
  ): Result<Application, InvalidApplicationNameError> {
    const name = params.name?.trim();
    if (!name) {
      return Result.fail(new InvalidApplicationNameError());
    }

    return Result.ok(
      new Application(
        {
          tenantId: params.tenantId,
          name,
          status: ApplicationStatus.ACTIVE,
          createdAt: new Date(),
        },
        id,
      ),
    );
  }

  static reconstitute(props: ApplicationProps, id: UniqueId): Application {
    return new Application(props, id);
  }

  get tenantId(): UniqueId {
    return this.props.tenantId;
  }

  get name(): string {
    return this.props.name;
  }

  get status(): ApplicationStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  isActive(): boolean {
    return this.props.status === ApplicationStatus.ACTIVE;
  }

  suspend(): void {
    this.props.status = ApplicationStatus.SUSPENDED;
  }

  activate(): void {
    this.props.status = ApplicationStatus.ACTIVE;
  }
}
