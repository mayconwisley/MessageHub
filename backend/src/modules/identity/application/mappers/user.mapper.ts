import { User } from '../../domain/entities/user.entity';
import { UserDto } from '../dto/user.dto';

export class UserMapper {
  static toDto(user: User): UserDto {
    return {
      id: user.id.value,
      tenantId: user.tenantId,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
    };
  }
}
