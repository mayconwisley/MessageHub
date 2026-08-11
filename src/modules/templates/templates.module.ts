import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetaModule } from '@infrastructure/meta/meta.module';
import { MetaTemplateProvider } from '@infrastructure/meta/services/meta-template.provider';
import { WhatsAppAccountsModule } from '@modules/whatsapp-accounts/whatsapp-accounts.module';
import { TEMPLATE_PROVIDER } from './application/ports/template-provider.interface';
import { TemplateManagementService } from './application/services/template-management.service';
import { TemplatesController } from './presentation/controllers/templates.controller';
import { TEMPLATE_REPOSITORY } from './domain/repositories/template.repository.interface';
import { TemplateOrmEntity } from './infrastructure/entities/template.orm-entity';
import { PostgresTemplateRepository } from './infrastructure/repositories/postgres-template.repository';

/**
 * Catálogo local de templates Meta, usado para rascunhos, sincronização e auditoria.
 */
@Module({
  imports: [MetaModule, WhatsAppAccountsModule, TypeOrmModule.forFeature([TemplateOrmEntity])],
  controllers: [TemplatesController],
  providers: [
    TemplateManagementService,
    { provide: TEMPLATE_REPOSITORY, useClass: PostgresTemplateRepository },
    { provide: TEMPLATE_PROVIDER, useExisting: MetaTemplateProvider },
  ],
})
export class TemplatesModule {}
