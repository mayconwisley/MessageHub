import { Entity, UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { WhatsAppAccountStatus } from '../enums/whatsapp-account-status.enum';
import { InvalidWhatsAppAccountError } from '../errors/invalid-whatsapp-account.error';

export interface WhatsAppAccountProps {
  tenantId: UniqueId;
  wabaId: string;
  accessToken: string;
  status: WhatsAppAccountStatus;
  createdAt: Date;
}

export interface RegisterWhatsAppAccountParams {
  tenantId: UniqueId;
  wabaId: string;
  accessToken: string;
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

    const accessToken = params.accessToken?.trim();
    if (!accessToken) {
      return Result.fail(new InvalidWhatsAppAccountError('accessToken must not be empty.'));
    }

    return Result.ok(
      new WhatsAppAccount(
        {
          tenantId: params.tenantId,
          wabaId,
          accessToken,
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

  /** Nunca expor via DTO/API ou logs (secao 15/27). Uso restrito a MetaWhatsAppProvider. */
  get accessToken(): string {
    return this.props.accessToken;
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
