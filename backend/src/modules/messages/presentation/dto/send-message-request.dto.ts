import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class SendMessageRequestDto {
  @ApiPropertyOptional({
    description: 'Obrigatório apenas para requisições autenticadas por sessão administrativa.',
  })
  @IsOptional()
  @IsUUID()
  applicationId?: string;

  @ApiProperty()
  @IsUUID()
  phoneNumberId!: string;

  @ApiProperty({
    example: '+5511999999999',
    description:
      'Telefone E.164 ou BSUID retornado pela Meta. O BSUID deve ser reutilizado exatamente como recebido em um webhook.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  to!: string;

  @ApiProperty({ example: 'Seu pedido foi confirmado!' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  content!: string;
}
