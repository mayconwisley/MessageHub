import { Inject, Injectable } from '@nestjs/common';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { WhatsAppAccount } from '@modules/whatsapp-accounts/domain/entities/whatsapp-account.entity';
import {
  IWhatsAppAccountRepository,
  WHATSAPP_ACCOUNT_REPOSITORY,
} from '@modules/whatsapp-accounts/domain/repositories/whatsapp-account.repository.interface';
import { WhatsAppAccountAccessDeniedError } from '../../domain/errors/whatsapp-account-access-denied.error';
import { WhatsAppAccountNotFoundError } from '../../domain/errors/whatsapp-account-not-found.error';

/** Resolve e valida que a conta do WhatsApp usada por uma operação de template pertence ao tenant. */
@Injectable()
export class TemplateAccountResolverService {
  constructor(
    @Inject(WHATSAPP_ACCOUNT_REPOSITORY) private readonly accounts: IWhatsAppAccountRepository,
  ) {}

  async resolve(
    tenantId: string,
    accountId: string,
  ): Promise<
    Result<WhatsAppAccount, WhatsAppAccountNotFoundError | WhatsAppAccountAccessDeniedError>
  > {
    const account = await this.accounts.findById(UniqueId.create(accountId));
    if (!account) {
      return Result.fail(new WhatsAppAccountNotFoundError());
    }
    if (account.tenantId.value !== tenantId) {
      return Result.fail(new WhatsAppAccountAccessDeniedError());
    }
    return Result.ok(account);
  }
}
