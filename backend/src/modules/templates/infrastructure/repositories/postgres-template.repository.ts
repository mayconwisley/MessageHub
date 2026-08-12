import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UniqueId } from '@shared/domain';
import { Repository } from 'typeorm';
import { Template, TemplateProps } from '../../domain/entities/template.entity';
import { TemplateStatus } from '../../domain/enums/template-status.enum';
import { ITemplateRepository } from '../../domain/repositories/template.repository.interface';
import { TemplateOrmEntity } from '../entities/template.orm-entity';
import { TemplateComponentDefinition } from '../../application/ports/template-provider.interface';

@Injectable()
export class PostgresTemplateRepository implements ITemplateRepository {
  constructor(
    @InjectRepository(TemplateOrmEntity) private readonly repository: Repository<TemplateOrmEntity>,
  ) {}
  async save(template: Template): Promise<void> {
    await this.repository.save(this.toOrm(template));
  }
  async remove(template: Template): Promise<void> {
    await this.repository.delete(template.id.value);
  }
  async findById(tenantId: UniqueId, id: UniqueId): Promise<Template | null> {
    const row = await this.repository.findOne({
      where: { id: id.value, tenantId: tenantId.value },
    });
    return row ? this.toDomain(row) : null;
  }
  async findByMetaId(
    tenantId: UniqueId,
    whatsAppAccountId: UniqueId,
    metaTemplateId: string,
  ): Promise<Template | null> {
    const row = await this.repository.findOne({
      where: {
        tenantId: tenantId.value,
        whatsAppAccountId: whatsAppAccountId.value,
        metaTemplateId,
      },
    });
    return row ? this.toDomain(row) : null;
  }
  async findByNameAndLanguage(
    tenantId: UniqueId,
    whatsAppAccountId: UniqueId,
    name: string,
    language: string,
  ): Promise<Template | null> {
    const row = await this.repository.findOne({
      where: {
        tenantId: tenantId.value,
        whatsAppAccountId: whatsAppAccountId.value,
        name,
        language,
      },
    });
    return row ? this.toDomain(row) : null;
  }
  async findByName(
    tenantId: UniqueId,
    whatsAppAccountId: UniqueId,
    name: string,
  ): Promise<Template[]> {
    return (
      await this.repository.find({
        where: { tenantId: tenantId.value, whatsAppAccountId: whatsAppAccountId.value, name },
      })
    ).map((row) => this.toDomain(row));
  }
  async list(tenantId: UniqueId, whatsAppAccountId: UniqueId): Promise<Template[]> {
    return (
      await this.repository.find({
        where: { tenantId: tenantId.value, whatsAppAccountId: whatsAppAccountId.value },
        order: { name: 'ASC', language: 'ASC' },
      })
    ).map((row) => this.toDomain(row));
  }
  private toOrm(template: Template): TemplateOrmEntity {
    return Object.assign(new TemplateOrmEntity(), {
      id: template.id.value,
      tenantId: template.tenantId.value,
      whatsAppAccountId: template.whatsAppAccountId.value,
      metaTemplateId: template.metaTemplateId,
      name: template.name,
      language: template.language,
      category: template.category,
      components: template.components,
      parameterFormat: template.parameterFormat,
      status: template.status,
      rejectedReason: template.rejectedReason,
      lastError: template.lastError,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    });
  }
  private toDomain(row: TemplateOrmEntity): Template {
    const props: TemplateProps = {
      tenantId: UniqueId.create(row.tenantId),
      whatsAppAccountId: UniqueId.create(row.whatsAppAccountId),
      metaTemplateId: row.metaTemplateId,
      name: row.name,
      language: row.language,
      category: row.category,
      components: row.components,
      parameterFormat: row.parameterFormat,
      status: row.status as TemplateStatus,
      rejectedReason: row.rejectedReason,
      lastError: row.lastError,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return Template.reconstitute(props, UniqueId.create(row.id));
  }
}
