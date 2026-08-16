import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmailMessageDto } from '../../application/dto/email-message.dto';
export class EmailMessageResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() applicationId!: string;
  @ApiProperty() to!: string;
  @ApiProperty() subject!: string;
  @ApiPropertyOptional() textBody!: string | null;
  @ApiPropertyOptional() htmlBody!: string | null;
  @ApiProperty() status!: string;
  @ApiPropertyOptional() idempotencyKey!: string | null;
  @ApiPropertyOptional() requestId!: string | null;
  @ApiPropertyOptional() providerMessageId!: string | null;
  @ApiProperty() attemptCount!: number;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
  static fromDto(dto: EmailMessageDto): EmailMessageResponseDto {
    return Object.assign(new EmailMessageResponseDto(), dto);
  }
}
