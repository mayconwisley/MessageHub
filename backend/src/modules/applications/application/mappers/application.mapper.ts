import { Application } from '../../domain/entities/application.entity';
import { ApplicationDto } from '../dto/application.dto';

export class ApplicationMapper {
  static toDto(application: Application): ApplicationDto {
    return {
      id: application.id.value,
      tenantId: application.tenantId.value,
      name: application.name,
      status: application.status,
      webhookUrl: application.webhookUrl,
      webhookSecret: application.webhookSecret,
      quotaPerMinute: application.quotaPerMinute,
      quotaPerDay: application.quotaPerDay,
      createdAt: application.createdAt,
    };
  }
}
