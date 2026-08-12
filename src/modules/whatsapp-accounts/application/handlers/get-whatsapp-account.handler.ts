import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { WhatsAppAccountNotFoundError } from '../../domain/errors/whatsapp-account-not-found.error';
import {
  IWhatsAppAccountRepository,
  WHATSAPP_ACCOUNT_REPOSITORY,
} from '../../domain/repositories/whatsapp-account.repository.interface';
import { WhatsAppAccountDto } from '../dto/whatsapp-account.dto';
import { WhatsAppAccountMapper } from '../mappers/whatsapp-account.mapper';
import { GetWhatsAppAccountQuery } from '../queries/get-whatsapp-account.query';

@QueryHandler(GetWhatsAppAccountQuery)
export class GetWhatsAppAccountHandler implements IQueryHandler<GetWhatsAppAccountQuery> {
  constructor(
    @Inject(WHATSAPP_ACCOUNT_REPOSITORY)
    private readonly whatsAppAccountRepository: IWhatsAppAccountRepository,
  ) {}

  async execute(
    query: GetWhatsAppAccountQuery,
  ): Promise<Result<WhatsAppAccountDto, WhatsAppAccountNotFoundError>> {
    const account = await this.whatsAppAccountRepository.findById(
      UniqueId.create(query.whatsAppAccountId),
    );
    if (!account || (query.tenantId && !account.tenantId.equals(UniqueId.create(query.tenantId)))) {
      return Result.fail(new WhatsAppAccountNotFoundError(query.whatsAppAccountId));
    }

    return Result.ok(WhatsAppAccountMapper.toDto(account));
  }
}
