import { Module } from '@nestjs/common';
import { MetaWebhooksController } from './presentation/controllers/meta-webhooks.controller';

/**
 * Esqueleto do Bounded Context de Webhooks (secao 7 do AGENTS.md).
 * Apenas o endpoint placeholder existe; processamento real fica para proxima iteracao.
 */
@Module({
  controllers: [MetaWebhooksController],
})
export class WebhooksModule {}
