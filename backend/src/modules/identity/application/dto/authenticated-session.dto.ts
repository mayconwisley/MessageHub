import { AuthenticatedUserDto } from './authenticated-user.dto';

export interface AuthenticatedSessionDto {
  accessToken: string;
  expiresAt: Date;
  user: AuthenticatedUserDto;
}
