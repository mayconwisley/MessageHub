import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { UserRole } from '../../domain/enums/user-role.enum';

export class CreateUserRequestDto {
  @IsString() @MinLength(2) name!: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(12) password!: string;
  @IsEnum(UserRole) role!: UserRole;
  @IsOptional() @IsUUID() tenantId?: string;
}
