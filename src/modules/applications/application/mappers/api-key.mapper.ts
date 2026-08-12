import { ApiKey } from '../../domain/entities/api-key.entity';
import { ApiKeyDto } from '../dto/api-key.dto';

export class ApiKeyMapper {
  static toDto(apiKey: ApiKey): ApiKeyDto {
    return {
      id: apiKey.id.value,
      applicationId: apiKey.applicationId.value,
      prefix: apiKey.prefix,
      status: apiKey.status,
      type: apiKey.type,
      createdAt: apiKey.createdAt,
      expiresAt: apiKey.expiresAt,
    };
  }
}
