import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { WhatsAppCredentialSource } from '../../domain/enums/whatsapp-credential-source.enum';

export class RegisterWhatsAppAccountRequestDto {
  @ApiProperty({ required: false, description: 'Obrigatório apenas para chamada administrativa.' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiProperty({ description: 'WhatsApp Business Account ID (Meta).' })
  @IsString()
  @IsNotEmpty()
  wabaId!: string;

  @ApiProperty({
    enum: WhatsAppCredentialSource,
    description:
      'default usa META_DEFAULT_CHANNEL_BEARER; tenant usa uma credencial própria protegida.',
  })
  @IsEnum(WhatsAppCredentialSource)
  credentialSource!: WhatsAppCredentialSource;

  @ApiProperty({
    required: false,
    writeOnly: true,
    description: 'Obrigatório apenas quando credentialSource for tenant. Nunca retornado pela API.',
  })
  @IsOptional()
  @IsString()
  accessToken?: string;

  @ApiProperty({
    required: false,
    writeOnly: true,
    description: 'App Secret da Meta usado para validar o HMAC dos webhooks deste tenant.',
  })
  @IsOptional()
  @IsString()
  appSecret?: string;

  @ApiProperty({
    required: false,
    description: 'Expiração conhecida da credencial da Meta (ISO 8601).',
  })
  @IsOptional()
  @IsDateString()
  credentialExpiresAt?: string;
}
