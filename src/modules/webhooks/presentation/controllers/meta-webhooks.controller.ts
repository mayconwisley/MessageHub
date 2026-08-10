import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

/**
 * Placeholder do endpoint unico de webhook da Meta (secao 23 do AGENTS.md).
 * Validacao/idempotencia/fila ainda nao implementadas nesta entrega.
 */
@ApiTags('webhooks')
@Controller('webhooks/meta')
export class MetaWebhooksController {
  @Post()
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  receive(): { message: string } {
    return { message: 'Meta webhook processing not implemented yet.' };
  }
}
