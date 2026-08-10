import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UniqueId } from '@shared/domain';
import {
  WhatsAppAccount,
  WhatsAppAccountProps,
} from '../../domain/entities/whatsapp-account.entity';
import { WhatsAppAccountStatus } from '../../domain/enums/whatsapp-account-status.enum';
import { IWhatsAppAccountRepository } from '../../domain/repositories/whatsapp-account.repository.interface';
import { WhatsAppAccountOrmEntity } from '../entities/whatsapp-account.orm-entity';

@Injectable()
export class PostgresWhatsAppAccountRepository implements IWhatsAppAccountRepository {
  constructor(
    @InjectRepository(WhatsAppAccountOrmEntity)
    private readonly repository: Repository<WhatsAppAccountOrmEntity>,
  ) {}

  async save(whatsAppAccount: WhatsAppAccount): Promise<void> {
    await this.repository.save(this.toOrmEntity(whatsAppAccount));
  }

  async findById(id: UniqueId): Promise<WhatsAppAccount | null> {
    const row = await this.repository.findOne({ where: { id: id.value } });
    return row ? this.toDomain(row) : null;
  }

  private toOrmEntity(account: WhatsAppAccount): WhatsAppAccountOrmEntity {
    const orm = new WhatsAppAccountOrmEntity();
    orm.id = account.id.value;
    orm.tenantId = account.tenantId.value;
    orm.wabaId = account.wabaId;
    orm.accessToken = account.accessToken;
    orm.status = account.status;
    orm.createdAt = account.createdAt;
    return orm;
  }

  private toDomain(row: WhatsAppAccountOrmEntity): WhatsAppAccount {
    const props: WhatsAppAccountProps = {
      tenantId: UniqueId.create(row.tenantId),
      wabaId: row.wabaId,
      accessToken: row.accessToken,
      status: row.status as WhatsAppAccountStatus,
      createdAt: row.createdAt,
    };
    return WhatsAppAccount.reconstitute(props, UniqueId.create(row.id));
  }
}
