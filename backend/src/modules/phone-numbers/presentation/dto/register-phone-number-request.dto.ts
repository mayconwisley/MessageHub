import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class RegisterPhoneNumberRequestDto {
  @ApiProperty()
  @IsUUID()
  whatsAppAccountId!: string;

  @ApiProperty({ description: 'Phone Number ID (Meta).' })
  @IsString()
  @IsNotEmpty()
  phoneNumberId!: string;

  @ApiProperty({ example: '+5511999999999' })
  @IsString()
  @IsNotEmpty()
  displayNumber!: string;
}
