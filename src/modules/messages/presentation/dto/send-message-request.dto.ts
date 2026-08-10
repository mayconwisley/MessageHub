import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class SendMessageRequestDto {
  @ApiProperty()
  @IsUUID()
  phoneNumberId!: string;

  @ApiProperty({ example: '+5511999999999' })
  @IsString()
  @IsNotEmpty()
  to!: string;

  @ApiProperty({ example: 'Seu pedido foi confirmado!' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  content!: string;
}
