import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { PaginatedResult } from '@shared/types';
import { BaseError } from '@shared/errors';
import {
  IWhatsAppAccountRepository,
  WHATSAPP_ACCOUNT_REPOSITORY,
} from '@modules/whatsapp-accounts/domain/repositories/whatsapp-account.repository.interface';
import {
  IPhoneNumberRepository,
  PHONE_NUMBER_REPOSITORY,
} from '../../domain/repositories/phone-number.repository.interface';
import { PhoneNumberDto } from '../dto/phone-number.dto';
import { PhoneNumberMapper } from '../mappers/phone-number.mapper';
import { ListPhoneNumbersQuery } from '../queries/list-phone-numbers.query';

@QueryHandler(ListPhoneNumbersQuery)
export class ListPhoneNumbersHandler implements IQueryHandler<ListPhoneNumbersQuery> {
  constructor(
    @Inject(PHONE_NUMBER_REPOSITORY) private readonly phoneNumbers: IPhoneNumberRepository,
    @Inject(WHATSAPP_ACCOUNT_REPOSITORY) private readonly accounts: IWhatsAppAccountRepository,
  ) {}

  async execute(
    query: ListPhoneNumbersQuery,
  ): Promise<Result<PaginatedResult<PhoneNumberDto>, BaseError>> {
    const accountIds = await this.accounts.findIdsByTenantId(UniqueId.create(query.tenantId));
    const result = await this.phoneNumbers.listByWhatsAppAccountIds(
      accountIds,
      query.page,
      query.pageSize,
      { status: query.status },
    );
    return Result.ok({ ...result, items: result.items.map(PhoneNumberMapper.toDto) });
  }
}
