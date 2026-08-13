import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WebhookEventOperationDto } from '../../application/ports/webhook-event-operations.repository.interface';
import { maskWebhookPayload } from '../webhook-payload-masker';

export class WebhookEventResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() provider!: string;
  @ApiProperty() status!: string;
  @ApiProperty() payload!: Record<string, unknown>;
  @ApiProperty() receivedAt!: Date;
  @ApiPropertyOptional() processedAt!: Date | null;
  @ApiPropertyOptional() failureReason!: string | null;
  @ApiProperty() attemptCount!: number;
  @ApiPropertyOptional() lastAttemptAt!: Date | null;

  static fromEntity(event: WebhookEventOperationDto): WebhookEventResponseDto {
    return Object.assign(new WebhookEventResponseDto(), {
      id: event.id,
      provider: event.provider,
      status: event.status,
      payload: maskWebhookPayload(event.payload) as Record<string, unknown>,
      receivedAt: event.receivedAt,
      processedAt: event.processedAt,
      failureReason: event.failureReason,
      attemptCount: event.attemptCount,
      lastAttemptAt: event.lastAttemptAt,
    });
  }
}
