import { BadRequestException } from '@nestjs/common';
import { AuthContextDto } from '@modules/applications/application/dto/api-key.dto';
import { AuthenticatedUserDto } from '@modules/identity/application/dto/authenticated-user.dto';

/**
 * Sessão administrativa exige o escopo explícito na requisição; API Key já o
 * resolve pelo próprio token (secao 17/18 do AGENTS.md).
 */
export function resolveRequiredTenantId(
  auth: AuthContextDto | undefined,
  user: AuthenticatedUserDto | undefined,
  explicit: string | undefined,
): string {
  const tenantId = auth?.tenantId ?? user?.tenantId ?? explicit;
  if (!tenantId) {
    throw new BadRequestException('tenantId é obrigatório para requisições administrativas.');
  }
  return tenantId;
}

export function resolveRequiredApplicationId(
  auth: AuthContextDto | undefined,
  explicit: string | undefined,
): string {
  const applicationId = auth?.applicationId ?? explicit;
  if (!applicationId) {
    throw new BadRequestException('applicationId é obrigatório para requisições administrativas.');
  }
  return applicationId;
}
