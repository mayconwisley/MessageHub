import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UniqueId } from '@shared/domain';
import { Application, ApplicationProps } from '../../domain/entities/application.entity';
import { ApplicationStatus } from '../../domain/enums/application-status.enum';
import { IApplicationRepository } from '../../domain/repositories/application.repository.interface';
import { ApplicationOrmEntity } from '../entities/application.orm-entity';

@Injectable()
export class PostgresApplicationRepository implements IApplicationRepository {
  constructor(
    @InjectRepository(ApplicationOrmEntity)
    private readonly repository: Repository<ApplicationOrmEntity>,
  ) {}

  async save(application: Application): Promise<void> {
    await this.repository.save(this.toOrmEntity(application));
  }

  async findById(id: UniqueId): Promise<Application | null> {
    const row = await this.repository.findOne({ where: { id: id.value } });
    return row ? this.toDomain(row) : null;
  }

  private toOrmEntity(application: Application): ApplicationOrmEntity {
    const orm = new ApplicationOrmEntity();
    orm.id = application.id.value;
    orm.tenantId = application.tenantId.value;
    orm.name = application.name;
    orm.status = application.status;
    orm.createdAt = application.createdAt;
    return orm;
  }

  private toDomain(row: ApplicationOrmEntity): Application {
    const props: ApplicationProps = {
      tenantId: UniqueId.create(row.tenantId),
      name: row.name,
      status: row.status as ApplicationStatus,
      createdAt: row.createdAt,
    };
    return Application.reconstitute(props, UniqueId.create(row.id));
  }
}
