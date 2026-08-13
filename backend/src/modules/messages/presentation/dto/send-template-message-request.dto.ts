import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';

/** Contrato público simplificado. A posição de cada item representa {{1}}, {{2}}, ... do BODY. */
export class SendTemplateMessageRequestDto {
  /** Obrigatório apenas para requisições autenticadas por sessão administrativa. */
  @ApiPropertyOptional() @IsOptional() @IsUUID() applicationId?: string;

  /**
   * Identifica o número remetente cadastrado no Hub. Obrigatório apenas se a
   * aplicação tiver mais de um número vinculado, ou nenhum — do contrário, usa
   * o único número vinculado via PUT /v1/applications/{id}/phone-numbers.
   */
  @ApiPropertyOptional() @IsOptional() @IsUUID() phoneNumberId?: string;

  @ApiProperty({
    example: '+5511999999999',
    description:
      'Telefone E.164 ou BSUID retornado pela Meta. O BSUID deve ser reutilizado exatamente como recebido em um webhook.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
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
