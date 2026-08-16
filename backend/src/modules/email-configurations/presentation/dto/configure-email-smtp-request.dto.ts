import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class ConfigureEmailSmtpRequestDto {
  @ApiPropertyOptional({ description: 'Obrigatório somente para administração da plataforma.' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;
  @ApiProperty({ example: 'smtp.office365.com' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  host!: string;
  @ApiProperty({ example: 587 }) @IsInt() @Min(1) @Max(65535) port!: number;
  @ApiProperty({ example: false }) @IsBoolean() secure!: boolean;
  @ApiProperty({ example: 'no-reply@empresa.com' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(320)
  username!: string;
  @ApiProperty({ format: 'password', writeOnly: true }) @IsString() @IsNotEmpty() password!: string;
  @ApiProperty({ example: 'no-reply@empresa.com' }) @IsEmail() @MaxLength(320) fromEmail!: string;
  @ApiProperty({ example: 'Empresa' }) @IsString() @IsNotEmpty() @MaxLength(255) fromName!: string;
}
