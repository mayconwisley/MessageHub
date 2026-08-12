import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUrl } from 'class-validator';

export class ConfigureWebhookRequestDto {
  @ApiPropertyOptional({
    example: 'https://example.com/webhooks/message-hub',
    description: 'URL que recebera notificacoes de status de mensagem. Envie null para remover.',
    nullable: true,
  })
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  webhookUrl?: string | null;
}
