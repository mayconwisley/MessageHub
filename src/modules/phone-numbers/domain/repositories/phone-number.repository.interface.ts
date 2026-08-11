import { UniqueId } from '@shared/domain';
import { PhoneNumber } from '../entities/phone-number.entity';

export interface IPhoneNumberRepository {
  save(phoneNumber: PhoneNumber): Promise<void>;
  findById(id: UniqueId): Promise<PhoneNumber | null>;
  findByProviderPhoneNumberId(phoneNumberId: string): Promise<PhoneNumber | null>;
}

export const PHONE_NUMBER_REPOSITORY = Symbol('PHONE_NUMBER_REPOSITORY');
