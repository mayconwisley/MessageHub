import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class RegisterWhatsAppAccountRequestDto {
  @ApiProperty()
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ description: 'WhatsApp Business Account ID (Meta).' })
  @IsString()
  @IsNotEmpty()
  wabaId!: string;

  @ApiProperty({ description: 'Access Token da Meta para esta WABA. Nunca retornado pela API.' })
  @IsString()
  @IsNotEmpty()
  accessToken!: string;
}
