import { UserRole } from '../../domain/enums/user-role.enum';

export interface AuthenticatedUserDto {
  id: string;
  email: string;
  role: UserRole;
  tenantId: string | null;
}
