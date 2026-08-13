export interface ApiKeyDto {
  id: string;
  applicationId: string;
  prefix: string;
  status: string;
  type: string;
  createdAt: Date;
  expiresAt: Date | null;
  scopes: string[];
  lastUsedAt: Date | null;
  lastUsedIp: string | null;
}

export interface CreatedApiKeyDto extends ApiKeyDto {
  plainTextKey: string;
}

export interface AuthContextDto {
  apiKeyId: string;
  applicationId: string;
  tenantId: string;
  type: string;
}
