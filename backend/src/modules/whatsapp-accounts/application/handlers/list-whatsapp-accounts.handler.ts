import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { PaginatedResult } from '@shared/types';
import { BaseError } from '@shared/errors';
import {
  IWhatsAppAccountRepository,
  WHATSAPP_ACCOUNT_REPOSITORY,
} from '../../domain/repositories/whatsapp-account.repository.interface';
import { WhatsAppAccountDto } from '../dto/whatsapp-account.dto';
import { WhatsAppAccountMapper } from '../mappers/whatsapp-account.mapper';
import { ListWhatsAppAccountsQuery } from '../queries/list-whatsapp-accounts.query';
@QueryHandler(ListWhatsAppAccountsQuery)
export class ListWhatsAppAccountsHandler implements IQueryHandler<ListWhatsAppAccountsQuery> {
  constructor(
    @Inject(WHATSAPP_ACCOUNT_REPOSITORY) private readonly accounts: IWhatsAppAccountRepository,
  ) {}
  async execute(
    query: ListWhatsAppAccountsQuery,
  ): Promise<Result<PaginatedResult<WhatsAppAccountDto>, BaseError>> {
    const result = await this.accounts.listByTenantId(
      UniqueId.create(query.tenantId),
      query.page,
      query.pageSize,
      { status: query.status, search: query.search },
    );
    return Result.ok({
      ...result,
      items: result.items.map((account) => WhatsAppAccountMapper.toDto(account)),
    });
  }
}
