import { UniqueId } from '@shared/domain';
import { PhoneNumber } from '../entities/phone-number.entity';
import { PaginatedResult } from '@shared/types';
import { PhoneNumberStatus } from '../enums/phone-number-status.enum';

export interface ListPhoneNumbersFilter {
  status?: PhoneNumberStatus;
  search?: string;
}

export interface IPhoneNumberRepository {
  save(phoneNumber: PhoneNumber): Promise<void>;
  findById(id: UniqueId): Promise<PhoneNumber | null>;
  findByProviderPhoneNumberId(phoneNumberId: string): Promise<PhoneNumber | null>;
  listByWhatsAppAccountIds(
    accountIds: UniqueId[],
    page: number,
    pageSize: number,
    filter?: ListPhoneNumbersFilter,
  ): Promise<PaginatedResult<PhoneNumber>>;
}

export const PHONE_NUMBER_REPOSITORY = Symbol('PHONE_NUMBER_REPOSITORY');
