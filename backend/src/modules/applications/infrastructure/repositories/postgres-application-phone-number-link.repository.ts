import { v7 as uuidv7 } from 'uuid';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UniqueId } from '@shared/domain';
import { IApplicationPhoneNumberLinkRepository } from '../../domain/repositories/application-phone-number-link.repository.interface';
import { ApplicationPhoneNumberLinkOrmEntity } from '../entities/application-phone-number-link.orm-entity';

@Injectable()
export class PostgresApplicationPhoneNumberLinkRepository implements IApplicationPhoneNumberLinkRepository {
  constructor(
    @InjectRepository(ApplicationPhoneNumberLinkOrmEntity)
    private readonly repository: Repository<ApplicationPhoneNumberLinkOrmEntity>,
  ) {}

  async replaceForApplication(applicationId: UniqueId, phoneNumberIds: UniqueId[]): Promise<void> {
    await this.repository.manager.transaction(async (manager) => {
      await manager.delete(ApplicationPhoneNumberLinkOrmEntity, {
        applicationId: applicationId.value,
      });
      if (phoneNumberIds.length === 0) return;
      const rows = phoneNumberIds.map((phoneNumberId) => {
        const row = new ApplicationPhoneNumberLinkOrmEntity();
        row.id = uuidv7();
        row.applicationId = applicationId.value;
        row.phoneNumberId = phoneNumberId.value;
        row.createdAt = new Date();
        return row;
      });
      await manager.insert(ApplicationPhoneNumberLinkOrmEntity, rows);
    });
  }

  async listPhoneNumberIdsByApplication(applicationId: UniqueId): Promise<UniqueId[]> {
    const rows = await this.repository.find({ where: { applicationId: applicationId.value } });
    return rows.map((row) => UniqueId.create(row.phoneNumberId));
  }

  async listApplicationIdsByPhoneNumber(phoneNumberId: UniqueId): Promise<UniqueId[]> {
    const rows = await this.repository.find({ where: { phoneNumberId: phoneNumberId.value } });
    return rows.map((row) => UniqueId.create(row.applicationId));
  }
}
