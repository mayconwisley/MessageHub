import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { MetaWhatsAppClient } from './clients/meta-whatsapp.client';
import { MetaWhatsAppProvider } from './services/meta-whatsapp.provider';

@Module({
  imports: [HttpModule],
  providers: [MetaWhatsAppClient, MetaWhatsAppProvider],
  exports: [MetaWhatsAppProvider],
})
export class MetaModule {}
