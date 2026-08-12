import { PhoneNumber } from '../../domain/entities/phone-number.entity';
import { PhoneNumberDto } from '../dto/phone-number.dto';

export class PhoneNumberMapper {
  static toDto(phoneNumber: PhoneNumber): PhoneNumberDto {
    return {
      id: phoneNumber.id.value,
      whatsAppAccountId: phoneNumber.whatsAppAccountId.value,
      phoneNumberId: phoneNumber.phoneNumberId,
      displayNumber: phoneNumber.displayNumber,
      status: phoneNumber.status,
      createdAt: phoneNumber.createdAt,
    };
  }
}
