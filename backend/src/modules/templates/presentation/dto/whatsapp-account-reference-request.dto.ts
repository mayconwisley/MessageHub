import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class WhatsAppAccountReferenceRequestDto {
  @ApiPropertyOptional({
    description: 'Obrigatório apenas para requisições autenticadas por sessão administrativa.',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiProperty()
  @IsUUID()
  whatsAppAccountId!: string;
}
