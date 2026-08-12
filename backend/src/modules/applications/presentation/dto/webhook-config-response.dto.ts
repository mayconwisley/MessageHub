import { ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationDto } from '../../application/dto/application.dto';

export class WebhookConfigResponseDto {
  @ApiPropertyOptional({ nullable: true })
  webhookUrl!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Segredo usado para validar a assinatura HMAC (header X-Hub-Signature-256).',
  })
  webhookSecret!: string | null;

  static fromDto(dto: ApplicationDto): WebhookConfigResponseDto {
    const response = new WebhookConfigResponseDto();
    response.webhookUrl = dto.webhookUrl;
    response.webhookSecret = dto.webhookSecret;
    return response;
  }
}
