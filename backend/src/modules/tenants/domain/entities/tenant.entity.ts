import { Entity, UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { TenantStatus } from '../enums/tenant-status.enum';
import { InvalidTenantNameError } from '../errors/invalid-tenant-name.error';
import { InvalidTenantRetentionError } from '../errors/invalid-tenant-retention.error';

export const DEFAULT_DATA_RETENTION_DAYS = 90;

export interface TenantProps {
  name: string;
  status: TenantStatus;
  dataRetentionDays?: number;
  createdAt: Date;
}

export interface CreateTenantParams {
  name: string;
  dataRetentionDays?: number;
}

export class Tenant extends Entity<TenantProps> {
  private constructor(props: TenantProps, id?: UniqueId) {
    super(props, id);
  }

  static create(
    params: CreateTenantParams,
    id?: UniqueId,
  ): Result<Tenant, InvalidTenantNameError | InvalidTenantRetentionError> {
    const name = params.name?.trim();
    if (!name) {
      return Result.fail(new InvalidTenantNameError());
    }

    const dataRetentionDays = params.dataRetentionDays ?? DEFAULT_DATA_RETENTION_DAYS;
    if (!Tenant.isValidDataRetentionDays(dataRetentionDays)) {
      return Result.fail(new InvalidTenantRetentionError());
    }

    return Result.ok(
      new Tenant(
        {
          name,
          status: TenantStatus.ACTIVE,
          dataRetentionDays,
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

  get dataRetentionDays(): number {
    return this.props.dataRetentionDays ?? DEFAULT_DATA_RETENTION_DAYS;
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

  updateDataRetentionDays(days: number): Result<void, InvalidTenantRetentionError> {
    if (!Tenant.isValidDataRetentionDays(days)) {
      return Result.fail(new InvalidTenantRetentionError());
    }
    this.props.dataRetentionDays = days;
    return Result.ok(undefined);
  }

  synchronizeFromDefaultChannel(name: string): void {
    this.props.name = name.trim();
    this.activate();
  }

  private static isValidDataRetentionDays(days: number): boolean {
    return Number.isInteger(days) && days >= 1 && days <= 3650;
  }
}
