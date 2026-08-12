import { Tenant } from '../../domain/entities/tenant.entity';
import { TenantDto } from '../dto/tenant.dto';

export class TenantMapper {
  static toDto(tenant: Tenant): TenantDto {
    return {
      id: tenant.id.value,
      name: tenant.name,
      status: tenant.status,
      createdAt: tenant.createdAt,
    };
  }
}
