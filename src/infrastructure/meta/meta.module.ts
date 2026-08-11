import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { MetaWhatsAppClient } from './clients/meta-whatsapp.client';
import { MetaWhatsAppProvider } from './services/meta-whatsapp.provider';
import { MetaTemplateProvider } from './services/meta-template.provider';

@Module({
  imports: [HttpModule],
  providers: [MetaWhatsAppClient, MetaWhatsAppProvider, MetaTemplateProvider],
  exports: [MetaWhatsAppProvider, MetaTemplateProvider],
})
export class MetaModule {}
