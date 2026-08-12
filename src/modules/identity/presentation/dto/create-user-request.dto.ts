import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { UserRole } from '../../domain/enums/user-role.enum';

export class CreateUserRequestDto {
  @ApiProperty({ example: 'Maria Silva' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: 'maria@acme.com', format: 'email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'senha-segura-com-12-caracteres', format: 'password', writeOnly: true })
  @IsString()
  @MinLength(12)
  password!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.TENANT_ADMIN })
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiPropertyOptional({ format: 'uuid', description: 'Obrigatório para usuários não globais.' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}
