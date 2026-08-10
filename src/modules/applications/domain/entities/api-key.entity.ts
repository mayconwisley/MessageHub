import { Entity, UniqueId } from '@shared/domain';
import { ApiKeyStatus } from '../enums/api-key-status.enum';

export interface ApiKeyProps {
  applicationId: UniqueId;
  hash: string;
  prefix: string;
  status: ApiKeyStatus;
  createdAt: Date;
  expiresAt: Date | null;
}

export interface CreateApiKeyParams {
  applicationId: UniqueId;
  hash: string;
  prefix: string;
  expiresAt?: Date | null;
}

export class ApiKey extends Entity<ApiKeyProps> {
  private constructor(props: ApiKeyProps, id?: UniqueId) {
    super(props, id);
  }

  static create(params: CreateApiKeyParams, id?: UniqueId): ApiKey {
    return new ApiKey(
      {
        applicationId: params.applicationId,
        hash: params.hash,
        prefix: params.prefix,
        status: ApiKeyStatus.ACTIVE,
        createdAt: new Date(),
        expiresAt: params.expiresAt ?? null,
      },
      id,
    );
  }

  static reconstitute(props: ApiKeyProps, id: UniqueId): ApiKey {
    return new ApiKey(props, id);
  }

  get applicationId(): UniqueId {
    return this.props.applicationId;
  }

  get hash(): string {
    return this.props.hash;
  }

  get prefix(): string {
    return this.props.prefix;
  }

  get status(): ApiKeyStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get expiresAt(): Date | null {
    return this.props.expiresAt;
  }

  revoke(): void {
    this.props.status = ApiKeyStatus.REVOKED;
  }

  isValid(now: Date = new Date()): boolean {
    if (this.props.status !== ApiKeyStatus.ACTIVE) {
      return false;
    }
    if (this.props.expiresAt && this.props.expiresAt.getTime() < now.getTime()) {
      return false;
    }
    return true;
  }
}
