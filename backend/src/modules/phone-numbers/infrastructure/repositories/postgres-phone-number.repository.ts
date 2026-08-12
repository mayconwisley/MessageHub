import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UniqueId } from '@shared/domain';
import { PhoneNumber, PhoneNumberProps } from '../../domain/entities/phone-number.entity';
import { PhoneNumberStatus } from '../../domain/enums/phone-number-status.enum';
import {
  IPhoneNumberRepository,
  ListPhoneNumbersFilter,
} from '../../domain/repositories/phone-number.repository.interface';
import { PhoneNumberOrmEntity } from '../entities/phone-number.orm-entity';
import { PaginatedResult } from '@shared/types';

@Injectable()
export class PostgresPhoneNumberRepository implements IPhoneNumberRepository {
  constructor(
    @InjectRepository(PhoneNumberOrmEntity)
    private readonly repository: Repository<PhoneNumberOrmEntity>,
  ) {}

  async save(phoneNumber: PhoneNumber): Promise<void> {
    await this.repository.save(this.toOrmEntity(phoneNumber));
  }

  async findById(id: UniqueId): Promise<PhoneNumber | null> {
    const row = await this.repository.findOne({ where: { id: id.value } });
    return row ? this.toDomain(row) : null;
  }

  async findByProviderPhoneNumberId(phoneNumberId: string): Promise<PhoneNumber | null> {
    const row = await this.repository.findOne({ where: { phoneNumberId } });
    return row ? this.toDomain(row) : null;
  }

  async listByWhatsAppAccountIds(
    accountIds: UniqueId[],
    page: number,
    pageSize: number,
    filter?: ListPhoneNumbersFilter,
  ): Promise<PaginatedResult<PhoneNumber>> {
    if (accountIds.length === 0) return { items: [], total: 0, page, pageSize };
    const [rows, total] = await this.repository.findAndCount({
      where: {
        whatsAppAccountId: In(accountIds.map((id) => id.value)),
        ...(filter?.status ? { status: filter.status } : {}),
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items: rows.map((row) => this.toDomain(row)), total, page, pageSize };
  }

  private toOrmEntity(phoneNumber: PhoneNumber): PhoneNumberOrmEntity {
    const orm = new PhoneNumberOrmEntity();
    orm.id = phoneNumber.id.value;
    orm.whatsAppAccountId = phoneNumber.whatsAppAccountId.value;
    orm.phoneNumberId = phoneNumber.phoneNumberId;
    orm.displayNumber = phoneNumber.displayNumber;
    orm.status = phoneNumber.status;
    orm.createdAt = phoneNumber.createdAt;
    return orm;
  }

  private toDomain(row: PhoneNumberOrmEntity): PhoneNumber {
    const props: PhoneNumberProps = {
      whatsAppAccountId: UniqueId.create(row.whatsAppAccountId),
      phoneNumberId: row.phoneNumberId,
      displayNumber: row.displayNumber,
      status: row.status as PhoneNumberStatus,
      createdAt: row.createdAt,
    };
    return PhoneNumber.reconstitute(props, UniqueId.create(row.id));
  }
}
