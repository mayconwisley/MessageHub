import { ApiProperty } from '@nestjs/swagger';
import { LinkedPhoneNumberDto } from '../../application/dto/linked-phone-number.dto';

export class LinkedPhoneNumberResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  phoneNumberId!: string;

  @ApiProperty()
  displayNumber!: string;

  static fromDto(dto: LinkedPhoneNumberDto): LinkedPhoneNumberResponseDto {
    const response = new LinkedPhoneNumberResponseDto();
    response.id = dto.id;
    response.phoneNumberId = dto.phoneNumberId;
    response.displayNumber = dto.displayNumber;
    return response;
  }
}
