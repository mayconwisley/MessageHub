import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { E164_PHONE_NUMBER_REGEX } from '@shared/constants';

/** Contrato público simplificado. A posição de cada item representa {{1}}, {{2}}, ... do BODY. */
export class SendTemplateMessageRequestDto {
  /** Obrigatório apenas para requisições autenticadas por sessão administrativa. */
  @ApiPropertyOptional() @IsOptional() @IsUUID() applicationId?: string;

  /** Identifica o número remetente cadastrado no Hub. */
  @ApiProperty() @IsUUID() phoneNumberId!: string;

  @ApiProperty({ example: '+5511999999999', description: 'Número do destinatário.' })
  @IsString()
  @IsNotEmpty()
  @Matches(E164_PHONE_NUMBER_REGEX, {
    message: 'to deve ser um número de telefone E.164 válido (ex: +5511999999999).',
  })
  to!: string;

  @ApiPropertyOptional({ description: 'ID do template na Meta.' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  templateId?: string;

  @ApiPropertyOptional({ description: 'Nome do template na Meta.' })
  @ValidateIf((dto: SendTemplateMessageRequestDto) => !dto.templateId)
  @IsString()
  @IsNotEmpty()
  templateName?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['Maycon', '12345'],
    description: 'Valores do BODY na ordem dos placeholders. Pode ser vazio.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(4096, { each: true })
  parameters?: string[];
}
