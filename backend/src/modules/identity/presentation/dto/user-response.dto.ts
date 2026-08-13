import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserDto } from '../../application/dto/user.dto';
import { UserRole } from '../../domain/enums/user-role.enum';
import { UserStatus } from '../../domain/enums/user-status.enum';

export class UserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  tenantId!: string | null;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: UserRole })
  role!: UserRole;

  @ApiProperty({ enum: UserStatus })
  status!: UserStatus;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiPropertyOptional({ nullable: true })
  lastLoginAt!: Date | null;

  static fromDto(dto: UserDto): UserResponseDto {
    const response = new UserResponseDto();
    response.id = dto.id;
    response.tenantId = dto.tenantId;
    response.name = dto.name;
    response.email = dto.email;
    response.role = dto.role;
    response.status = dto.status;
    response.createdAt = dto.createdAt;
    response.updatedAt = dto.updatedAt;
    response.lastLoginAt = dto.lastLoginAt;
    return response;
  }
}
