import { randomBytes } from 'crypto';
import { Entity, UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { ApplicationStatus } from '../enums/application-status.enum';
import { InvalidApplicationNameError } from '../errors/invalid-application-name.error';

export interface ApplicationProps {
  tenantId: UniqueId;
  name: string;
  status: ApplicationStatus;
  webhookUrl: string | null;
  webhookSecret: string | null;
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
          webhookUrl: null,
          webhookSecret: null,
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

  get webhookUrl(): string | null {
    return this.props.webhookUrl;
  }

  get webhookSecret(): string | null {
    return this.props.webhookSecret;
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

  /** Configura (ou remove, quando url e null) o callback de status de mensagens. Gera um novo segredo apenas quando a URL passa de nao-configurada para configurada. */
  configureWebhook(url: string | null): void {
    if (!url) {
      this.props.webhookUrl = null;
      this.props.webhookSecret = null;
      return;
    }
    this.props.webhookUrl = url;
    if (!this.props.webhookSecret) {
      this.props.webhookSecret = randomBytes(32).toString('hex');
    }
  }
}
