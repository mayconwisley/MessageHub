import { Entity, UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { TenantStatus } from '../enums/tenant-status.enum';
import { InvalidTenantNameError } from '../errors/invalid-tenant-name.error';

export interface TenantProps {
  name: string;
  status: TenantStatus;
  createdAt: Date;
}

export interface CreateTenantParams {
  name: string;
}

export class Tenant extends Entity<TenantProps> {
  private constructor(props: TenantProps, id?: UniqueId) {
    super(props, id);
  }

  static create(params: CreateTenantParams, id?: UniqueId): Result<Tenant, InvalidTenantNameError> {
    const name = params.name?.trim();
    if (!name) {
      return Result.fail(new InvalidTenantNameError());
    }

    return Result.ok(
      new Tenant(
        {
          name,
          status: TenantStatus.ACTIVE,
          createdAt: new Date(),
        },
        id,
      ),
    );
  }

  static reconstitute(props: TenantProps, id: UniqueId): Tenant {
    return new Tenant(props, id);
  }

  get name(): string {
    return this.props.name;
  }

  get status(): TenantStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  isActive(): boolean {
    return this.props.status === TenantStatus.ACTIVE;
  }

  suspend(): void {
    this.props.status = TenantStatus.SUSPENDED;
  }

  activate(): void {
    this.props.status = TenantStatus.ACTIVE;
  }
}
