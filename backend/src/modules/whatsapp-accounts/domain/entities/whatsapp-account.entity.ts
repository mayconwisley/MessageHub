import { Entity, UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { WhatsAppAccountStatus } from '../enums/whatsapp-account-status.enum';
import { WhatsAppCredentialSource } from '../enums/whatsapp-credential-source.enum';
import { InvalidWhatsAppAccountError } from '../errors/invalid-whatsapp-account.error';

export interface WhatsAppAccountProps {
  tenantId: UniqueId;
  wabaId: string;
  credentialSource: WhatsAppCredentialSource;
  accessToken: string | null;
  appSecret: string | null;
  status: WhatsAppAccountStatus;
  createdAt: Date;
}

export interface RegisterWhatsAppAccountParams {
  tenantId: UniqueId;
  wabaId: string;
  credentialSource?: WhatsAppCredentialSource;
  accessToken?: string;
  appSecret?: string;
}

export class WhatsAppAccount extends Entity<WhatsAppAccountProps> {
  private constructor(props: WhatsAppAccountProps, id?: UniqueId) {
    super(props, id);
  }

  static create(
    params: RegisterWhatsAppAccountParams,
    id?: UniqueId,
  ): Result<WhatsAppAccount, InvalidWhatsAppAccountError> {
    const wabaId = params.wabaId?.trim();
    if (!wabaId) {
      return Result.fail(new InvalidWhatsAppAccountError('wabaId must not be empty.'));
    }

    const credentialSource = params.credentialSource ?? WhatsAppCredentialSource.TENANT;
    if (!Object.values(WhatsAppCredentialSource).includes(credentialSource)) {
      return Result.fail(new InvalidWhatsAppAccountError('credentialSource is invalid.'));
    }

    const accessToken = params.accessToken?.trim() ?? null;
    const appSecret = params.appSecret?.trim() ?? null;
    if (credentialSource === WhatsAppCredentialSource.TENANT && !accessToken) {
      return Result.fail(
        new InvalidWhatsAppAccountError('accessToken must not be empty for tenant credentials.'),
      );
    }

    if (credentialSource === WhatsAppCredentialSource.DEFAULT && accessToken) {
      return Result.fail(
        new InvalidWhatsAppAccountError(
          'accessToken must not be provided for default credentials.',
        ),
      );
    }

    return Result.ok(
      new WhatsAppAccount(
        {
          tenantId: params.tenantId,
          wabaId,
          credentialSource,
          accessToken,
          appSecret,
          status: WhatsAppAccountStatus.ACTIVE,
          createdAt: new Date(),
        },
        id,
      ),
    );
  }

  static reconstitute(props: WhatsAppAccountProps, id: UniqueId): WhatsAppAccount {
    return new WhatsAppAccount(props, id);
  }

  get tenantId(): UniqueId {
    return this.props.tenantId;
  }

  get wabaId(): string {
    return this.props.wabaId;
  }

  get credentialSource(): WhatsAppCredentialSource {
    return this.props.credentialSource;
  }

  /** Nunca expor via DTO/API ou logs (secao 15/27). Uso restrito a MetaWhatsAppProvider. */
  get accessToken(): string | null {
    return this.props.accessToken;
  }

  /** Segredo HMAC do webhook, nunca exposto fora da infraestrutura. */
  get appSecret(): string | null {
    return this.props.appSecret;
  }

  get status(): WhatsAppAccountStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  isActive(): boolean {
    return this.props.status === WhatsAppAccountStatus.ACTIVE;
  }

  suspend(): void {
    this.props.status = WhatsAppAccountStatus.SUSPENDED;
  }
}
