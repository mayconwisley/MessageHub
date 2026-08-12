import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';
import { E164_PHONE_NUMBER_REGEX } from '@shared/constants';

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

  @ApiProperty({ example: '+5511999999999' })
  @IsString()
  @IsNotEmpty()
  @Matches(E164_PHONE_NUMBER_REGEX, {
    message: 'to deve ser um número de telefone E.164 válido (ex: +5511999999999).',
  })
  to!: string;

  @ApiProperty({ example: 'Seu pedido foi confirmado!' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  content!: string;
}
