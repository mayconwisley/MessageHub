import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindOptionsOrder,
  FindOptionsWhere,
  ILike,
  In,
  QueryFailedError,
  Repository,
} from 'typeorm';
import { UniqueId } from '@shared/domain';
import { resolveDateRangeOperator } from '@shared/persistence/resolve-date-range-operator.util';
import { PhoneNumber, PhoneNumberProps } from '../../domain/entities/phone-number.entity';
import { PhoneNumberAlreadyRegisteredError } from '../../domain/errors/phone-number-already-registered.error';
import { PhoneNumberStatus } from '../../domain/enums/phone-number-status.enum';
import {
  IPhoneNumberRepository,
  ListPhoneNumbersFilter,
  PhoneNumberSortField,
} from '../../domain/repositories/phone-number.repository.interface';
import { PhoneNumberOrmEntity } from '../entities/phone-number.orm-entity';
import { PaginatedResult, SortDirection } from '@shared/types';

const UNIQUE_VIOLATION = '23505';

@Injectable()
export class PostgresPhoneNumberRepository implements IPhoneNumberRepository {
  constructor(
    @InjectRepository(PhoneNumberOrmEntity)
    private readonly repository: Repository<PhoneNumberOrmEntity>,
  ) {}

  async save(phoneNumber: PhoneNumber): Promise<void> {
    try {
      await this.repository.save(this.toOrmEntity(phoneNumber));
    } catch (error) {
      const driverCode =
        error instanceof QueryFailedError
          ? (error.driverError as { code?: string }).code
          : undefined;
      if (driverCode === UNIQUE_VIOLATION) {
        throw new PhoneNumberAlreadyRegisteredError(phoneNumber.phoneNumberId);
      }
      throw error;
    }
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
    const createdAtRange = resolveDateRangeOperator(filter?.createdFrom, filter?.createdTo);
    const baseWhere: FindOptionsWhere<PhoneNumberOrmEntity> = {
      whatsAppAccountId: In(accountIds.map((id) => id.value)),
      ...(filter?.status ? { status: filter.status } : {}),
      ...(createdAtRange ? { createdAt: createdAtRange } : {}),
    };
    const where: FindOptionsWhere<PhoneNumberOrmEntity> | FindOptionsWhere<PhoneNumberOrmEntity>[] =
      filter?.search
        ? [
            { ...baseWhere, displayNumber: ILike(`%${filter.search}%`) },
            { ...baseWhere, phoneNumberId: ILike(`%${filter.search}%`) },
          ]
        : baseWhere;

    const [rows, total] = await this.repository.findAndCount({
      where,
      order: this.resolveOrder(filter?.sortBy, filter?.sortDirection),
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items: rows.map((row) => this.toDomain(row)), total, page, pageSize };
  }

  private resolveOrder(
    sortBy?: PhoneNumberSortField,
    sortDirection?: SortDirection,
  ): FindOptionsOrder<PhoneNumberOrmEntity> {
    const field = sortBy ?? PhoneNumberSortField.CREATED_AT;
    const direction = sortDirection ?? SortDirection.DESC;
    return { [field]: direction };
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
