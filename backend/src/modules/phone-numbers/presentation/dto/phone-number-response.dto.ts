import { ApiProperty } from '@nestjs/swagger';
import { PhoneNumberDto } from '../../application/dto/phone-number.dto';

export class PhoneNumberResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  whatsAppAccountId!: string;

  @ApiProperty()
  phoneNumberId!: string;

  @ApiProperty()
  displayNumber!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  createdAt!: Date;

  static fromDto(dto: PhoneNumberDto): PhoneNumberResponseDto {
    const response = new PhoneNumberResponseDto();
    response.id = dto.id;
    response.whatsAppAccountId = dto.whatsAppAccountId;
    response.phoneNumberId = dto.phoneNumberId;
    response.displayNumber = dto.displayNumber;
    response.status = dto.status;
    response.createdAt = dto.createdAt;
    return response;
  }
}
