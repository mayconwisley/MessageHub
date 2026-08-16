import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
export class SendEmailRequestDto {
  @ApiPropertyOptional({ description: 'Obrigatório apenas para sessão administrativa.' })
  @IsOptional()
  @IsUUID()
  applicationId?: string;
  @ApiProperty({ example: 'cliente@exemplo.com' }) @IsEmail() @MaxLength(320) to!: string;
  @ApiProperty({ example: 'Pedido confirmado' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  subject!: string;
  @ApiPropertyOptional({ example: 'Seu pedido foi confirmado.' })
  @ValidateIf((dto: SendEmailRequestDto) => !dto.htmlBody)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100000)
  textBody?: string;
  @ApiPropertyOptional({ example: '<p>Seu pedido foi confirmado.</p>' })
  @ValidateIf((dto: SendEmailRequestDto) => !dto.textBody)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100000)
  htmlBody?: string;
}
