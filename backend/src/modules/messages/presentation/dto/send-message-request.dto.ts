import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, Matches, MaxLength } from 'class-validator';
import { E164_PHONE_NUMBER_REGEX } from '@shared/constants';

export class SendMessageRequestDto {
  @ApiProperty()
  @IsUUID()
  phoneNumberId!: string;

  @ApiProperty({ example: '+5511999999999' })
  @IsString()
  @IsNotEmpty()
  @Matches(E164_PHONE_NUMBER_REGEX, {
    message: 'to must be a valid E.164 phone number (e.g. +5511999999999).',
  })
  to!: string;

  @ApiProperty({ example: 'Seu pedido foi confirmado!' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  content!: string;
}
