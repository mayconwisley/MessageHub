import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmailTimelineEventDto } from '../../application/ports/email-timeline.repository.interface';

export class EmailTimelineEventResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() emailMessageId!: string;
  @ApiProperty({ example: 'DELIVERY_ATTEMPT_STARTED' }) eventType!: string;
  @ApiProperty({ example: 'PROCESSING' }) status!: string;
  @ApiProperty({ enum: ['API', 'WORKER', 'OPERATOR'] }) source!: 'API' | 'WORKER' | 'OPERATOR';
  @ApiPropertyOptional() attemptNumber?: number | null;
  @ApiPropertyOptional() errorCode?: string | null;
  @ApiPropertyOptional() errorMessage?: string | null;
  @ApiPropertyOptional({ type: 'object', additionalProperties: true }) metadata?: Record<
    string,
    unknown
  >;
  @ApiProperty() occurredAt!: Date;

  static fromDto(dto: EmailTimelineEventDto): EmailTimelineEventResponseDto {
    return Object.assign(new EmailTimelineEventResponseDto(), dto);
  }
}
