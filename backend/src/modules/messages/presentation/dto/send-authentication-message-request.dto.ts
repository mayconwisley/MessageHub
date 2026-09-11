import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

/** Contrato semântico para OTP: o consumidor não precisa conhecer componentes da API da Meta. */
export class SendAuthenticationMessageRequestDto {
  /** Obrigatório apenas para requisições autenticadas por sessão administrativa. */
  @ApiPropertyOptional() @IsOptional() @IsUUID() applicationId?: string;

  /** Opcional quando a aplicação possui exatamente um número remetente vinculado. */
  @ApiPropertyOptional() @IsOptional() @IsUUID() phoneNumberId?: string;

  @ApiProperty({
    example: '5511999999999',
    description: 'Telefone de destino com DDI. O sinal + é opcional.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  to!: string;

  @ApiPropertyOptional({ description: 'ID do template de autenticação na Meta.' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  templateId?: string;

  @ApiPropertyOptional({
    example: 'folhabox_codigo_acesso',
    description: 'Nome do template de autenticação aprovado na Meta.',
  })
  @ValidateIf((dto: SendAuthenticationMessageRequestDto) => !dto.templateId)
  @IsString()
  @IsNotEmpty()
  templateName?: string;

  @ApiProperty({ example: '391827', description: 'Código OTP de seis dígitos.' })
  @IsString()
  @Matches(/^\d{6}$/)
  code!: string;
}
