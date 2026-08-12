import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class WhatsAppAccountReferenceRequestDto {
  @ApiProperty()
  @IsUUID()
  whatsAppAccountId!: string;
}
