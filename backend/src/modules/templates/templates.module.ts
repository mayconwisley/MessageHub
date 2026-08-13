import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediatorModule } from '@shared/mediator';
import { MetaModule } from '@infrastructure/meta/meta.module';
import { MetaTemplateProvider } from '@infrastructure/meta/services/meta-template.provider';
import { WhatsAppAccountsModule } from '@modules/whatsapp-accounts/whatsapp-accounts.module';
import { TEMPLATE_PROVIDER } from './application/ports/template-provider.interface';
import { CreateTemplateHandler } from './application/handlers/create-template.handler';
import { DeleteTemplateHandler } from './application/handlers/delete-template.handler';
import { GetTemplateHandler } from './application/handlers/get-template.handler';
import { ListTemplatesHandler } from './application/handlers/list-templates.handler';
import { PublishPendingTemplatesHandler } from './application/handlers/publish-pending-templates.handler';
import { SyncTemplatesHandler } from './application/handlers/sync-templates.handler';
import { UpdateTemplateHandler } from './application/handlers/update-template.handler';
import { TemplateAccountResolverService } from './application/services/template-account-resolver.service';
import { TemplateSyncService } from './application/services/template-sync.service';
import { TemplatesController } from './presentation/controllers/templates.controller';
import { TEMPLATE_REPOSITORY } from './domain/repositories/template.repository.interface';
import { TemplateOrmEntity } from './infrastructure/entities/template.orm-entity';
import { PostgresTemplateRepository } from './infrastructure/repositories/postgres-template.repository';

/**
 * Catálogo local de templates Meta, usado para rascunhos, sincronização e auditoria.
 */
@Module({
  imports: [
    MediatorModule,
    MetaModule,
    WhatsAppAccountsModule,
    TypeOrmModule.forFeature([TemplateOrmEntity]),
  ],
  controllers: [TemplatesController],
  providers: [
    { provide: TEMPLATE_REPOSITORY, useClass: PostgresTemplateRepository },
    { provide: TEMPLATE_PROVIDER, useExisting: MetaTemplateProvider },
    TemplateAccountResolverService,
    TemplateSyncService,
    CreateTemplateHandler,
    ListTemplatesHandler,
    GetTemplateHandler,
    SyncTemplatesHandler,
    PublishPendingTemplatesHandler,
    UpdateTemplateHandler,
    DeleteTemplateHandler,
  ],
  exports: [TEMPLATE_REPOSITORY],
})
export class TemplatesModule {}
