import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsByteLength,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../domain/enums/user-role.enum';

export class CreateUserRequestDto {
  @ApiProperty({ example: 'Maria Silva' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name!: string;

  @ApiProperty({ example: 'maria@acme.com', format: 'email' })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @ApiProperty({ example: 'senha-segura-com-12-caracteres', format: 'password', writeOnly: true })
  @IsString()
  @IsByteLength(12, 72)
  password!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.TENANT_ADMIN })
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiPropertyOptional({ format: 'uuid', description: 'Obrigatório para usuários não globais.' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}
